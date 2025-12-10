const MaterialCostUsed = require('../model/MaterialCostUsed')
const MaterialAssignment = require('../model/MaterialAssignment')
const MaterialBudget = require('../model/MaterialBudget')
const ProductionScope = require('../model/ProductionScope')
const { paginateQuery } = require('../utils/pagination')
const { recalculateAssignmentCodePrice, calculatedPhases } = require('../utils/recalculateAssignmentCodePrice')

const getDate = (month) => {
    let startDate = null;
    let endDate = null;
    const [queryYear, queryMonth] = month.split('-').map(Number); // [2025, 12]

    // Đảm bảo tháng có 2 chữ số (VD: 01, 12)
    const paddedMonth = String(queryMonth).padStart(2, '0');

    // Ngày đầu tiên luôn là '01'
    startDate = `${queryYear}-${paddedMonth}-01`; // Ví dụ: "2025-12-01"

    const nextMonthDate = new Date(queryYear, queryMonth, 1);

    nextMonthDate.setDate(nextMonthDate.getDate() - 1);

    const lastDay = nextMonthDate.getDate();

    endDate = `${queryYear}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate };
}

exports.create = async (req, res) => {
    try {
        const { productionScope, phases, month, materials } = req.body
        const { startDate, endDate } = getDate(month);

        const result = await calculatedPhases(phases, month, "budget")

        const totalBudgetCost = result.reduce((sum, item) => sum + (item?.totalBudgetCost || 0), 0)

        const processedMaterials = await Promise.all(
            materials.map(async (doc) => {
                const material = await MaterialAssignment.findById(doc?.material);
                let matched = null;

                if (material && Array.isArray(material.priceHistory)) {
                    if (startDate && endDate) {
                        matched = material.priceHistory.find(priceItem =>
                            startDate >= priceItem.startDate && endDate <= priceItem.endDate
                        );
                    } else {
                        matched = material.priceHistory.find(priceItem =>
                            todayStr >= priceItem.startDate && todayStr <= priceItem.endDate
                        );
                    }
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
        console.log(req.body.phases)
        const result = await calculatedPhases(req.body.phases, req.body.month, "budget")
        const { startDate, endDate } = getDate(req.body.month);

        const totalBudgetCost = result.reduce((sum, item) => sum + item.totalBudgetCost, 0)

        const processedMaterials = await Promise.all(
            req.body.materials.map(async (doc) => {
                const material = await MaterialAssignment.findById(doc?.material);
                let matched = null;

                if (material && Array.isArray(material.priceHistory)) {
                    if (startDate && endDate) {
                        matched = material.priceHistory.find(priceItem =>
                            startDate >= priceItem.startDate && endDate <= priceItem.endDate
                        );
                    } else {
                        matched = material.priceHistory.find(priceItem =>
                            todayStr >= priceItem.startDate && todayStr <= priceItem.endDate
                        );
                    }
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
        const updateData = await MaterialCostUsed.findByIdAndUpdate(req.params.id, {
            ...req.body,
            totalUsedCost,
            materials: processedMaterials
        }, { new: true })
        if (!updateData) {
            return res.status(404).json({ status: 'error', message: 'Sửa thất bại' })
        }

        await MaterialBudget.findOneAndUpdate(
            { productionScope: req.body.productionScope, month: req.body.month },
            { phases: result, totalBudgetCost },
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
        let query = {}
        if (req.query.q) {
            const productionScopes = await ProductionScope.find({ code: new RegExp(req.query.q, 'i') })
            const productionScopeIds = productionScopes.map(i => i._id)
            query.productionScope = { $in: productionScopeIds }
        }
        const modelQuery = MaterialCostUsed.find(query)
            .populate({
                path: 'productionScope',
                select: 'code name phases',
                populate: [
                    { path: 'phases.phase', populate: 'code name' }
                ]
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
        const allDocs = await modelQuery.lean().exec(); // Dùng .lean() để tăng hiệu suất

        // 3. Xử lý dữ liệu bằng JavaScript để nhóm
        const groupedMap = new Map();

        for (const doc of allDocs) {
            const scopeId = doc.productionScope._id.toString();

            if (!groupedMap.has(scopeId)) {
                // Khởi tạo tài liệu mới cho productionScope này
                groupedMap.set(scopeId, {
                    _id: scopeId,
                    productionScope: doc.productionScope,
                    minMonth: null,
                    maxMonth: null,
                    group: []
                });
            }

            const groupedDoc = groupedMap.get(scopeId);

            const currentMonthDate = new Date(doc.month + '-01');

            if (!groupedDoc.minMonth || currentMonthDate < new Date(groupedDoc.minMonth + '-01')) {
                groupedDoc.minMonth = doc.month;
            }
            if (!groupedDoc.maxMonth || currentMonthDate > new Date(groupedDoc.maxMonth + '-01')) {
                groupedDoc.maxMonth = doc.month;
            }

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
            })
            const materials = Object.values(groupMaterialMap);
            materials.sort((a, b) => {
                const codeA = a.assignmentCode?.code || 'NO_ASSIGNMENTCODE';
                const codeB = b.assignmentCode?.code || 'NO_ASSIGNMENTCODE';

                // 1. Đẩy nhóm không có Mã giao khoán xuống cuối
                if (codeA === 'NO_ASSIGNMENTCODE' && codeB !== 'NO_ASSIGNMENTCODE') {
                    return 1; // A lớn hơn B -> A đi sau
                }
                if (codeA !== 'NO_ASSIGNMENTCODE' && codeB === 'NO_ASSIGNMENTCODE') {
                    return -1; // A nhỏ hơn B -> A đi trước
                }

                // 2. Sắp xếp Alphabetical (A-Z) cho các nhóm có Mã giao khoán
                // Hoặc nếu cả hai đều là 'NO_ASSIGNMENTCODE' (sắp xếp giữa các nhóm rỗng)
                if (codeA < codeB) {
                    return -1;
                }
                if (codeA > codeB) {
                    return 1;
                }

                return 0; // Giữ nguyên thứ tự nếu bằng nhau
            });

            // Thêm dữ liệu vào mảng 'group'
            groupedDoc.group.push({
                _id: doc._id,
                month: doc.month,
                totalUsedCost: doc.totalUsedCost,
                phases: doc.phases,
                materials: materials
            });
        }

        // Chuyển Map thành mảng
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

        // 4. Áp dụng phân trang sau khi nhóm (nếu cần)
        // Đây là nơi logic phân trang nên được áp dụng, vì lúc này ta đã có các document đã nhóm
        const totalItems = results.length;

        const hasPaginationParams = req.query.page && req.query.limit;

        let paginatedData;
        let page;
        let limit;
        if (hasPaginationParams) {
            page = parseInt(req.query.page) || 1;
            limit = parseInt(req.query.limit) || 10;
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            paginatedData = results.slice(startIndex, endIndex);
        } else {

            page = 1;
            limit = totalItems;
            paginatedData = results; // Lấy toàn bộ mảng results
        }
        const totalPages = Math.ceil(totalItems / limit);
        const pagination = {
            data: paginatedData,
            page: page,
            totalDocs: totalItems,
            totalPages: totalPages
        };

        res.status(200).json({ status: 'success', data: pagination })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}
