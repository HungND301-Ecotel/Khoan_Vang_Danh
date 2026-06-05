const MaterialCostUsed = require('../model/MaterialCostUsed')
const MaterialAssignment = require('../model/MaterialAssignment')
const MaterialBudget = require('../model/MaterialBudget')
const ProductionScope = require('../model/ProductionScope')
const { paginateQuery } = require('../utils/pagination')
const { recalculateAssignmentCodePrice, calculatedPhases } = require('../utils/recalculateAssignmentCodePrice')
const { monthToNumber } = require('../utils/helpers')

exports.create = async (req, res) => {
    try {
        const { productionScope, phases, month, materials } = req.body

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

        const newMaterialCostUsed = new MaterialCostUsed({ productionScope, month, phases, materials: processedMaterials, totalUsedCost })
        await newMaterialCostUsed.save()

        try {
            const newMaterialBudget = new MaterialBudget({ productionScope, month, phases: result, totalBudgetCost })
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
            { productionScope: oldData.productionScope, month: oldData.month },
            {
                productionScope: req.body.productionScope,
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
            { productionScope: deleteData.productionScope, month: deleteData.month },
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

        let scopeMatchQuery = {}; // Query cho ProductionScope

        // 1. Xử lý điều kiện tìm kiếm theo req.query.q
        if (req.query.q) {
            const productionScopes = await ProductionScope.find({ code: new RegExp(req.query.q, 'i') }).select('_id');
            const productionScopeIds = productionScopes.map(i => i?._id);
            // Chỉ match những InitialPlannedCost có productionScope nằm trong kết quả tìm kiếm
            scopeMatchQuery.productionScope = { $in: productionScopeIds };
        }

        // --- BƯỚC 1: Lấy các ProductionScope (có dữ liệu trong MaterialCostUsed) cần hiển thị ---

        // A. Tìm các productionScope ID DUY NHẤT trong MaterialCostUsed thỏa mãn điều kiện tìm kiếm.
        // Đây là cách tối ưu nhất để phân trang trên các scope có dữ liệu.
        const uniqueScopeIds = await MaterialCostUsed.distinct('productionScope', scopeMatchQuery);

        // B. Lọc các scope ID đó theo phân trang
        const totalItems = uniqueScopeIds.length; // Tổng số ProductionScope đã nhóm

        // Lấy các ID cho trang hiện tại
        const paginatedScopeIds = uniqueScopeIds.slice(skip, skip + limit);

        // C. Populate thông tin ProductionScope cho các ID đã phân trang
        const targetScopes = await ProductionScope.find({ _id: { $in: paginatedScopeIds } })
            .select('code name')
            .lean()
            .exec();

        // 2. Query MaterialCostUsed: Chỉ lấy các document có productionScope nằm trong các ID đã phân trang
        const initialPlannedCostQuery = { productionScope: { $in: paginatedScopeIds } };

        // --- BƯỚC 2: Thực hiện query toàn bộ MaterialCostUsed cho các Scope đã chọn (KHÔNG phân trang) ---

        const allDocs = await MaterialCostUsed.find(initialPlannedCostQuery)
            .populate({
                path: 'productionScope',
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

        // --- BƯỚC 3: Xử lý dữ liệu bằng JavaScript để nhóm ---

        const groupedMap = new Map();

        // Khởi tạo Map với các ProductionScope đã được phân trang (đã populate)
        for (const scope of targetScopes) {
            groupedMap.set(scope?._id.toString(), {
                _id: scope?._id.toString(),
                productionScope: scope, // Đã populate
                minMonth: null,
                maxMonth: null,
                group: []
            });
        }

        for (const doc of allDocs) {
            const scopeId = doc.productionScope?._id.toString();

            if (groupedMap.has(scopeId)) { // Chỉ xử lý các scope đã được phân trang
                const groupedDoc = groupedMap.get(scopeId);

                // --- Logic tìm Min/Max Month ---
                const currentMonthDate = new Date(doc.month + '-01');
                if (!groupedDoc.minMonth || currentMonthDate < new Date(groupedDoc.minMonth + '-01')) {
                    groupedDoc.minMonth = doc.month;
                }
                if (!groupedDoc.maxMonth || currentMonthDate > new Date(groupedDoc.maxMonth + '-01')) {
                    groupedDoc.maxMonth = doc.month;
                }

                // --- Logic nhóm Vật tư (Materials Grouping) ---
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

                // --- Logic Sắp xếp Vật tư (Giữ nguyên) ---
                materials.sort((a, b) => {
                    const codeA = a.assignmentCode?.code || 'NO_ASSIGNMENTCODE';
                    const codeB = b.assignmentCode?.code || 'NO_ASSIGNMENTCODE';
                    // Sắp xếp: NO_ASSIGNMENTCODE xuống cuối, còn lại A-Z
                    if (codeA === 'NO_ASSIGNMENTCODE' && codeB !== 'NO_ASSIGNMENTCODE') return 1;
                    if (codeA !== 'NO_ASSIGNMENTCODE' && codeB === 'NO_ASSIGNMENTCODE') return -1;
                    if (codeA < codeB) return -1;
                    if (codeA > codeB) return 1;
                    return 0;
                });

                // Thêm dữ liệu vào mảng 'group'
                groupedDoc.group.push({
                    _id: doc?._id,
                    month: doc.month,
                    totalUsedCost: doc.totalUsedCost,
                    phases: doc.phases,
                    materials: materials
                });
            }
        }

        // Chuyển Map thành mảng và định dạng tháng
        const results = Array.from(groupedMap.values()).map(item => {
            const formatMonth = (m) => {
                if (!m) return '';
                const [y, mm] = m.split('-');
                return `${mm}/${y}`;
            };

            return {
                ...item,
                month: `${formatMonth(item.minMonth)} -> ${formatMonth(item.maxMonth)}`
            };
        });

        // 4. Trả về kết quả phân trang
        const totalPages = Math.ceil(totalItems / limit);
        const pagination = {
            data: results, // Dữ liệu đã được nhóm và phân trang
            page: page,
            totalDocs: totalItems, // Tổng số ProductionScope duy nhất có dữ liệu
            totalPages: totalPages
        };

        res.status(200).json({ status: 'success', data: pagination });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ status: 'error', message: err.message });
    }
};
