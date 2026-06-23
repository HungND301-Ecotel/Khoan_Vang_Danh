const InitialPlannedCost = require('../model/InitialPlannedCost')
const MaterialCostUsed = require('../model/MaterialCostUsed')
const MaterialBudget = require('../model/MaterialBudget')
const ProductionScope = require('../model/ProductionScope')
const MaterialAssignment = require('../model/MaterialAssignment')
const { paginateQuery } = require('../utils/pagination')
const { recalculateAssignmentCodePrice, calculatedPhases } = require('../utils/recalculateAssignmentCodePrice')
const { monthToNumber } = require('../utils/helpers')
const Department = require('../model/Department')

const syncRelatedData = async (productionScope, department, month, phases, oldProductionScope, oldDepartment, oldMonth) => {
    try {
        const searchScope = oldProductionScope || productionScope;
        const searchDepartment = oldDepartment || department;
        const searchMonth = oldMonth || month;

        // 1. Lấy dữ liệu hiện có từ MCU và MB dựa trên thông tin cũ (nếu có) hoặc thông tin hiện tại
        const [existingMCU, existingMB] = await Promise.all([
            MaterialCostUsed.findOne({ productionScope: searchScope, department: searchDepartment, month: searchMonth }),
            MaterialBudget.findOne({ productionScope: searchScope, department: searchDepartment, month: searchMonth })
        ])

        // 2. Tạo mảng phases đồng bộ (ưu tiên lấy production từ MCU hiện có, nếu không có để mặc định là 0)
        const synchronizedPhases = phases.map(p => {
            const pObj = p.toObject ? p.toObject() : p;
            const phaseId = (pObj.phase?._id || pObj.phase).toString();

            const mcuPhase = existingMCU?.phases?.find(ph => ph.phase.toString() === phaseId);

            return {
                ...pObj,
                production: mcuPhase?.production ?? 0
            };
        });

        // 3. Đồng bộ sang MaterialCostUsed trước
        if (existingMCU) {
            existingMCU.productionScope = productionScope; // Cập nhật sang scope mới (nếu đổi)
            existingMCU.department = department;           // Cập nhật sang department mới (nếu đổi)
            existingMCU.month = month;                     // Cập nhật sang tháng mới (nếu đổi)
            existingMCU.phases = synchronizedPhases;

            // Tái tính toán giá và chi phí cho từng vật tư trong MCU dựa trên tháng mới
            if (existingMCU.materials && existingMCU.materials.length > 0) {
                const refreshedMaterials = await Promise.all(
                    existingMCU.materials.map(async (doc) => {
                        const material = await MaterialAssignment.findById(doc?.material);
                        let matched = null;

                        if (material && Array.isArray(material.priceHistory)) {
                            matched = material.priceHistory.find(priceItem => {
                                const start = monthToNumber(priceItem.startMonth)
                                const end = monthToNumber(priceItem.endMonth)
                                const checkMonth = monthToNumber(month)
                                return start <= checkMonth && checkMonth <= end
                            });
                        }
                        const priceResult = await recalculateAssignmentCodePrice(material?.assignmentCode, null, null, month);

                        const price = material?.assignmentCode ? priceResult : (matched ? matched.price : 0);
                        return {
                            material: doc.material,
                            quantity: Number(doc.quantity),
                            price: price || 0,
                            cost: (price || 0) * Number(doc.quantity || 0)
                        };
                    })
                );
                existingMCU.materials = refreshedMaterials;
                existingMCU.totalUsedCost = refreshedMaterials.reduce((sum, item) => sum + item.cost, 0);
            }

            await existingMCU.save()
        } else {
            const newMCU = new MaterialCostUsed({
                productionScope,
                department,
                month,
                phases: synchronizedPhases,
                materials: [],
                totalUsedCost: 0
            })
            await newMCU.save()
        }

        // 4. Tính toán phases cho MaterialBudget dựa trên synchronizedPhases
        const budgetPhases = await calculatedPhases(synchronizedPhases, month, "budget")
        const totalBudgetCost = budgetPhases.reduce((sum, item) => sum + (item?.totalBudgetCost || 0), 0)

        // 5. Đồng bộ sang MaterialBudget sau (sử dụng findOneAndUpdate với filter cũ để cập nhật sang tháng mới)
        await MaterialBudget.findOneAndUpdate(
            { productionScope: searchScope, department: searchDepartment, month: searchMonth },
            {
                productionScope: productionScope,
                department: department,
                month: month,
                phases: budgetPhases,
                totalBudgetCost
            },
            { upsert: true, new: true },
        );
    } catch (error) {
        console.error("Lỗi đồng bộ dữ liệu liên quan:", error.stack)
        throw error
    }
}

exports.create = async (req, res) => {
    try {
        const { department, month, groups } = req.body; // groups: [{ productionScope, phases }]

        if (groups && Array.isArray(groups)) {
            const errors = [];
            for (const group of groups) {
                try {
                    const { productionScope, phases } = group;
                    const result = await calculatedPhases(phases, month, "initial")
                    const totalInitialPlannedCost = result.reduce((sum, item) => sum + item.totalInitialPlannedCost, 0)

                    await InitialPlannedCost.findOneAndUpdate(
                        { productionScope, department, month },
                        { phases: result, totalInitialPlannedCost },
                        { upsert: true, new: true }
                    )
                    await syncRelatedData(productionScope, department, month, phases)
                } catch (err) {
                    console.error(`Lỗi khi xử lý nhóm diện ${group.productionScope}:`, err.message);
                    errors.push({ productionScope: group.productionScope, error: err.message });
                }
            }

            if (errors.length > 0) {
                return res.status(201).json({ 
                    status: 'partial_success', 
                    message: 'Hoàn thành với một số lỗi', 
                    errors 
                });
            }
        } else {
            // Hỗ trợ format cũ
            const { productionScope, phases } = req.body;
            const result = await calculatedPhases(phases, month, "initial")
            const totalInitialPlannedCost = result.reduce((sum, item) => sum + item.totalInitialPlannedCost, 0)

            const newInitialPlannedCost = new InitialPlannedCost({
                productionScope,
                department,
                month,
                phases: result,
                totalInitialPlannedCost
            });
            await newInitialPlannedCost.save();
            await syncRelatedData(productionScope, department, month, phases)
        }

        res.status(201).json({ status: 'success', message: 'Tạo và đồng bộ thành công' });
    } catch (err) {
        console.error("Lỗi nghiêm trọng trong create InitialPlannedCost:", err.stack);
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const oldData = await InitialPlannedCost.findById(req.params.id)
        if (!oldData) {
            return res.status(404).json({ status: 'error', message: 'Sửa thất bại - Không tìm thấy dữ liệu cũ' })
        }

        const result = await calculatedPhases(req.body.phases, req.body.month, "initial")

        const totalInitialPlannedCost = result.reduce((sum, item) => sum + item.totalInitialPlannedCost, 0)

        const updateData = await InitialPlannedCost.findByIdAndUpdate(
            req.params.id,
            { ...req.body, phases: result, totalInitialPlannedCost },
            { new: true })
        if (!updateData) {
            return res.status(404).json({ status: 'error', message: 'Sửa thất bại' })
        }

        // Đồng bộ dữ liệu liên quan (truyền cả thông tin cũ để tìm đúng bản ghi MCU/MB)
        await syncRelatedData(updateData.productionScope, updateData.department, updateData.month, updateData.phases, oldData.productionScope, oldData.department, oldData.month)

        res.status(200).json({ status: 'success', message: 'Sửa và đồng bộ thành công' })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.delete = async (req, res) => {
    try {
        const deleteData = await InitialPlannedCost.findByIdAndDelete(req.params.id)
        if (!deleteData) {
            return res.status(404).json({ status: 'error', message: 'Xóa thất bại' })
        }

        // Xóa dữ liệu liên quan (lần lượt MCU rồi đến MB)
        await MaterialCostUsed.findOneAndDelete({
            productionScope: deleteData.productionScope,
            department: deleteData.department,
            month: deleteData.month
        })
        await MaterialBudget.findOneAndDelete({
            productionScope: deleteData.productionScope,
            department: deleteData.department,
            month: deleteData.month
        })

        res.status(200).json({ status: 'success', message: 'Xóa và đồng bộ thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}


exports.get = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let scopeMatchQuery = {};

        if (req.query.q) {
            const departments = await Department.find({ code: new RegExp(req.query.q, 'i') }).select('_id');
            const departmentIds = departments.map(i => i?._id);
            scopeMatchQuery.department = { $in: departmentIds };
        }

        if (req.query.department) {
            scopeMatchQuery.department = req.query.department;
        }

        const uniqueDepartmentIds = await InitialPlannedCost.distinct('department', scopeMatchQuery);

        const totalItems = uniqueDepartmentIds.length; 

        const paginatedDepartmentIds = uniqueDepartmentIds.slice(skip, skip + limit);

        const targetDepartments = await Department.find({ _id: { $in: paginatedDepartmentIds } })
            .select('code name')
            .lean()
            .exec();

        const matchQuery = { department: { $in: paginatedDepartmentIds } };

        const allDocs = await InitialPlannedCost.find(matchQuery)
            .populate({
                path: 'productionScope',
                select: 'code name',
            })
            .populate({
                path: 'department',
                select: 'code name',
            })
            .populate('phases.phase', 'code name')
            .populate({
                path: 'phases.initialPlannedCostDetails.assignmentCode',
                select: 'code name uom',
                populate: { path: 'uom', select: 'name' }
            })
            .populate({
                path: 'phases.assignmentNormCode',
                select: 'norms code',
                populate: {
                    path: 'norms.assignmentCode',
                    populate: { path: 'uom' }
                }
            })
            .populate({
                path: 'phases.adjustmentNormCode',
                select: 'norms code',
                populate: {
                    path: 'norms.assignmentCode',
                    populate: { path: 'uom' }
                }
            })
            .lean()
            .exec();


        const groupedMap = new Map();

        for (const dept of targetDepartments) {
            groupedMap.set(dept?._id.toString(), {
                _id: dept?._id.toString(),
                department: dept, 
                minMonth: null,
                maxMonth: null,
                totalInitialPlannedCost: 0,
                monthGroups: {}
            });
        }

        for (const doc of allDocs) {
            const deptId = doc.department?._id.toString();

            if (groupedMap.has(deptId)) { 
                const deptGroup = groupedMap.get(deptId);

                const currentMonthDate = new Date(doc.month + '-01');
                if (!deptGroup.minMonth || currentMonthDate < new Date(deptGroup.minMonth + '-01')) {
                    deptGroup.minMonth = doc.month;
                }
                if (!deptGroup.maxMonth || currentMonthDate > new Date(deptGroup.maxMonth + '-01')) {
                    deptGroup.maxMonth = doc.month;
                }

                deptGroup.totalInitialPlannedCost += (doc.totalInitialPlannedCost || 0);

                if (!deptGroup.monthGroups[doc.month]) {
                    deptGroup.monthGroups[doc.month] = {
                        _id: doc.month,
                        month: doc.month,
                        totalMonthCost: 0,
                        scopes: []
                    };
                }

                const monthGroup = deptGroup.monthGroups[doc.month];
                monthGroup.totalMonthCost += (doc.totalInitialPlannedCost || 0);

                monthGroup.scopes.push({
                    _id: doc?._id,
                    productionScope: doc.productionScope,
                    totalInitialPlannedCost: doc.totalInitialPlannedCost,
                    phases: doc.phases.map(phaseItem => ({
                        ...phaseItem,
                        key: `${doc._id.toString()}_${phaseItem.phase?._id?.toString()}`
                    }))
                });
            }
        }

        const results = Array.from(groupedMap.values()).map(item => {
            const formatMonth = (m) => {
                if (!m) return '';
                const [y, mm] = m.split('-');
                return `${mm}/${y}`;
            };

            const monthsArray = Object.values(item.monthGroups).sort((a, b) => {
                return new Date(b.month + '-01') - new Date(a.month + '-01'); 
            });

            return {
                _id: item._id,
                department: item.department,
                totalInitialPlannedCost: item.totalInitialPlannedCost,
                month: `${formatMonth(item.minMonth)} -> ${formatMonth(item.maxMonth)}`,
                months: monthsArray
            };
        });

        const totalPages = Math.ceil(totalItems / limit);
        const pagination = {
            data: results, 
            page: page,
            totalDocs: totalItems, 
            totalPages: totalPages
        };

        res.status(200).json({ status: 'success', data: pagination });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ status: 'error', message: err.message });
    }
};
exports.getScopesByDepartment = async (req, res) => {
    try {
        const { departmentId } = req.params;
        const scopes = await InitialPlannedCost.find({ department: departmentId })
            .populate('productionScope', 'code name')
            .lean();
        
        const uniqueScopes = [];
        const scopeSet = new Set();
        for (const doc of scopes) {
            if (doc.productionScope && !scopeSet.has(doc.productionScope._id.toString())) {
                scopeSet.add(doc.productionScope._id.toString());
                uniqueScopes.push(doc.productionScope);
            }
        }
        res.status(200).json({ status: 'success', data: uniqueScopes });
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message });
    }
}

exports.getOne = async (req, res) => {
    try {

        // 2. Thực hiện query với Populate
        // Lấy tất cả dữ liệu liên quan mà không cần nhóm, nhưng giới hạn theo phân trang
        const scopeId = req.params.productionScope
        const departmentId = req.query.department

        const query = { productionScope: scopeId }
        if (departmentId) {
            query.department = departmentId
        }

        const modelQuery = InitialPlannedCost.find(query)
            .populate({
                path: 'productionScope',
                select: 'code name',
            })
            .populate('phases.phase', 'code name')
            .populate({
                path: 'phases.initialPlannedCostDetails.assignmentCode', // Đường dẫn lồng
                select: 'code name uom', // Chọn các trường bạn muốn hiển thị ở Frontend
                populate: "uom"
            })
            .populate({
                path: 'phases.assignmentNormCode',
                select: 'norms code',
                populate: [
                    { path: 'norms.assignmentCode', populate: 'uom' }
                ]
            })
            .populate({
                path: 'phases.adjustmentNormCode',
                select: 'norms code',
                populate: [
                    { path: 'norms.assignmentCode', populate: 'uom' }
                ]
            })
        // Thêm các populate còn thiếu


        const allDocs = await modelQuery.lean().exec(); // Dùng .lean() để tăng hiệu suất
        if (allDocs.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy dữ liệu InitialPlannedCost cho phạm vi sản xuất này.' });
        }
        // 3. Xử lý dữ liệu bằng JavaScript để nhóm
        let data = {
            _id: scopeId,
            productionScope: allDocs[0]?.productionScope,
            group: []
        }

        for (const doc of allDocs) {

            // Thêm dữ liệu vào mảng 'group'
            data.group.push({
                _id: doc._id,
                month: doc.month,
                totalInitialPlannedCost: doc.totalInitialPlannedCost,
                phases: doc.phases.map((phaseItem) => ({
                    ...phaseItem,
                    key: `${doc._id.toString()}_${phaseItem.phase._id.toString()}`
                }))
            });
        }

        res.status(200).json({ status: 'success', data })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}