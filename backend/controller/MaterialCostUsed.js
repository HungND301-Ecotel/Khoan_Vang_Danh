const MaterialCostUsed = require('../model/MaterialCostUsed')
const MaterialAssignment = require('../model/MaterialAssignment')
const MaterialBudget = require('../model/MaterialBudget')
const ProductionScope = require('../model/ProductionScope')
const OtherMaterialCost = require('../model/OtherMaterialCost')
const { paginateQuery } = require('../utils/pagination')
const { recalculateAssignmentCodePrice, calculatedPhases } = require('../utils/recalculateAssignmentCodePrice')
const { monthToNumber } = require('../utils/helpers')
const Department = require('../model/Department')

exports.create = async (req, res) => {
    try {
        const { productionScope, department, phases, month, materials } = req.body

        const result = await calculatedPhases(phases, month, "budget")

        const totalBudgetCost = result.reduce((sum, item) => sum + (item?.totalBudgetCost || 0), 0)

        const processedMaterials = await Promise.all(
            materials.map(async (doc) => {
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
                const result = await recalculateAssignmentCodePrice(material?.assignmentCode, null, null, month);

                const price = material.assignmentCode ? result : (matched ? matched.price : 0);
                return {
                    material: doc.material,
                    quantity: Number(doc.quantity),
                    price: price || 0,
                    cost: (price || 0) * Number(doc.quantity || 0)
                };
            })
        );
        const totalUsedCost = processedMaterials.reduce((sum, item) => sum + item.cost, 0)

        const newMaterialCostUsed = new MaterialCostUsed({ productionScope, department, month, phases, materials: processedMaterials, totalUsedCost })
        await newMaterialCostUsed.save()

        try {
            const newMaterialBudget = new MaterialBudget({ productionScope, department, month, phases: result, totalBudgetCost })
            await newMaterialBudget.save()
        } catch (error) {
            console.log(error.stack)
            res.status(500).json({ status: 'error', message: "Lỗi khi tạo chi phí vật tư kế hoạch" })
        }

        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const result = await calculatedPhases(req.body.phases, req.body.month, "budget")

        const totalBudgetCost = result.reduce((sum, item) => sum + item.totalBudgetCost, 0)

        const processedMaterials = await Promise.all(
            req.body.materials.map(async (doc) => {
                const material = await MaterialAssignment.findById(doc?.material);
                let matched = null;

                if (material && Array.isArray(material.priceHistory)) {
                    matched = material.priceHistory.find(priceItem => {
                        const start = monthToNumber(priceItem.startMonth)
                        const end = monthToNumber(priceItem.endMonth)
                        const checkMonth = monthToNumber(req.body.month)
                        return start <= checkMonth && checkMonth <= end
                    });
                }
                const result = await recalculateAssignmentCodePrice(material?.assignmentCode, null, null, req.body.month);

                const price = material.assignmentCode ? result : (matched ? matched.price : 0);
                return {
                    material: doc.material,
                    quantity: Number(doc.quantity),
                    price: price || 0,
                    cost: (price || 0) * Number(doc.quantity || 0)
                };
            })
        );
        const totalUsedCost = processedMaterials.reduce((sum, item) => sum + item.cost, 0)
        const oldData = await MaterialCostUsed.findById(req.params.id)
        if (!oldData) {
            return res.status(404).json({ status: 'error', message: 'Sửa thất bại - Không tìm thấy dữ liệu cũ' })
        }

        const updateData = await MaterialCostUsed.findByIdAndUpdate(req.params.id, {
            ...req.body,
            totalUsedCost,
            materials: processedMaterials
        }, { new: true })
        if (!updateData) {
            return res.status(404).json({ status: 'error', message: 'Sửa thất bại' })
        }

        await MaterialBudget.findOneAndUpdate(
            { productionScope: oldData.productionScope, department: oldData.department, month: oldData.month },
            {
                productionScope: req.body.productionScope,
                department: req.body.department,
                month: req.body.month,
                phases: result,
                totalBudgetCost
            },
            { new: true }
        );

        res.status(200).json({ status: 'success', message: 'Sửa thành công' })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.delete = async (req, res) => {
    try {
        const deleteData = await MaterialCostUsed.findByIdAndDelete(req.params.id)
        if (!deleteData) {
            return res.status(404).json({ status: 'error', message: 'Xóa thất bại' })
        }
        await MaterialBudget.findOneAndDelete(
            { productionScope: deleteData.productionScope, department: deleteData.department, month: deleteData.month },
        );
        res.status(200).json({ status: 'success', message: 'Xóa thành công' })
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

        const uniqueDepartmentIds = await MaterialCostUsed.distinct('department', scopeMatchQuery);

        const totalItems = uniqueDepartmentIds.length; 

        const paginatedDepartmentIds = uniqueDepartmentIds.slice(skip, skip + limit);

        const targetDepartments = await Department.find({ _id: { $in: paginatedDepartmentIds } })
            .select('code name')
            .lean()
            .exec();

        const matchQuery = { department: { $in: paginatedDepartmentIds } };

        const allDocs = await MaterialCostUsed.find(matchQuery)
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
                path: 'materials.material',
                populate: [
                    { path: 'uom', select: 'name' },
                    {
                        path: 'assignmentCode', select: 'code name uom',
                        populate: 'uom'
                    }
                ]
            })
            .lean()
            .exec();

        const allOtherDocs = await OtherMaterialCost.find(matchQuery)
            .populate({
                path: 'department',
                select: 'code name',
            })
            .populate({
                path: 'materials.material',
                populate: [
                    { path: 'uom', select: 'name' },
                    {
                        path: 'assignmentCode', select: 'code name uom',
                        populate: 'uom'
                    }
                ]
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
                totalUsedCost: 0,
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

                deptGroup.totalUsedCost += (doc.totalUsedCost || 0);

                if (!deptGroup.monthGroups[doc.month]) {
                    deptGroup.monthGroups[doc.month] = {
                        _id: doc.month,
                        month: doc.month,
                        totalMonthCost: 0,
                        scopes: []
                    };
                }

                const monthGroup = deptGroup.monthGroups[doc.month];
                monthGroup.totalMonthCost += (doc.totalUsedCost || 0);

                const groupMaterialMap = {};
                doc.materials.map((mat) => {
                    const material = mat.material;
                    const assignmentCode = material?.assignmentCode?.code || "";
                    const price = material?.assignmentCode ? mat.price : '';
                    const compoundKey = material?.assignmentCode ? `${assignmentCode}_${price}` : '';

                    if (!groupMaterialMap[compoundKey]) {
                        groupMaterialMap[compoundKey] = {
                            assignmentCode: material?.assignmentCode,
                            price: price,
                            materials: []
                        };
                    }
                    groupMaterialMap[compoundKey].materials.push({
                        ...mat,
                        material
                    });
                });

                const materials = Object.values(groupMaterialMap);
                materials.sort((a, b) => {
                    const codeA = a.assignmentCode?.code || 'NO_ASSIGNMENTCODE';
                    const codeB = b.assignmentCode?.code || 'NO_ASSIGNMENTCODE';
                    if (codeA === 'NO_ASSIGNMENTCODE' && codeB !== 'NO_ASSIGNMENTCODE') return 1;
                    if (codeA !== 'NO_ASSIGNMENTCODE' && codeB === 'NO_ASSIGNMENTCODE') return -1;
                    if (codeA < codeB) return -1;
                    if (codeA > codeB) return 1;
                    return 0;
                });

                monthGroup.scopes.push({
                    _id: doc?._id,
                    productionScope: doc.productionScope,
                    totalUsedCost: doc.totalUsedCost,
                    phases: doc.phases,
                    materials: materials
                });
            }
        }

        for (const doc of allOtherDocs) {
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

                deptGroup.totalUsedCost += (doc.totalUsedCost || 0);

                if (!deptGroup.monthGroups[doc.month]) {
                    deptGroup.monthGroups[doc.month] = {
                        _id: doc.month,
                        month: doc.month,
                        totalMonthCost: 0,
                        scopes: []
                    };
                }

                const monthGroup = deptGroup.monthGroups[doc.month];
                monthGroup.totalMonthCost += (doc.totalUsedCost || 0);

                const groupMaterialMap = {};
                doc.materials.map((mat) => {
                    const material = mat.material;
                    const assignmentCode = material?.assignmentCode?.code || "";
                    const price = material?.assignmentCode ? mat.price : '';
                    const compoundKey = material?.assignmentCode ? `${assignmentCode}_${price}` : '';

                    if (!groupMaterialMap[compoundKey]) {
                        groupMaterialMap[compoundKey] = {
                            assignmentCode: material?.assignmentCode,
                            price: price,
                            materials: []
                        };
                    }
                    groupMaterialMap[compoundKey].materials.push({
                        ...mat,
                        material
                    });
                });

                const materials = Object.values(groupMaterialMap);
                materials.sort((a, b) => {
                    const codeA = a.assignmentCode?.code || 'NO_ASSIGNMENTCODE';
                    const codeB = b.assignmentCode?.code || 'NO_ASSIGNMENTCODE';
                    if (codeA === 'NO_ASSIGNMENTCODE' && codeB !== 'NO_ASSIGNMENTCODE') return 1;
                    if (codeA !== 'NO_ASSIGNMENTCODE' && codeB === 'NO_ASSIGNMENTCODE') return -1;
                    if (codeA < codeB) return -1;
                    if (codeA > codeB) return 1;
                    return 0;
                });

                monthGroup.scopes.push({
                    _id: doc?._id,
                    isOtherTask: true,
                    productionScope: { _id: doc?._id, code: "Công việc khác", name: "Công việc khác" },
                    totalUsedCost: doc.totalUsedCost,
                    materials: materials
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
                totalUsedCost: item.totalUsedCost,
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
