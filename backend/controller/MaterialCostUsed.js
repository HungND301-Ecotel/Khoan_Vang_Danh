const MaterialCostUsed = require('../model/MaterialCostUsed')
const MaterialAssignment = require('../model/MaterialAssignment')
const MaterialBudget = require('../model/MaterialBudget')
const ProductionScope = require('../model/ProductionScope')
const { paginateQuery } = require('../utils/pagination')
const { recalculateAssignmentCodePrice, calculatedPhases } = require('../utils/recalculateAssignmentCodePrice')


exports.create = async (req, res) => {
    try {
        const { productionScope, phases, startDate, endDate, materials } = req.body

        const todayStr = new Date().toISOString().split('T')[0];

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

                return {
                    material: doc.material,
                    quantity: Number(doc.quantity),
                    price: matched?.price || 0,
                    cost: (matched?.price || 0) * Number(doc.quantity || 0)
                };
            })
        );
        const totalUsedCost= processedMaterials.reduce((sum, item) => sum + item.cost, 0)

        const newMaterialCostUsed = new MaterialCostUsed({ productionScope, startDate, endDate, phases, materials: processedMaterials, totalUsedCost })
        await newMaterialCostUsed.save()

        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {

        const todayStr = new Date().toISOString().split('T')[0];

        const processedMaterials = await Promise.all(
            req.body.materials.map(async (doc) => {
                const material = await MaterialAssignment.findById(doc?.material);
                let matched = null;

                if (material && Array.isArray(material.priceHistory)) {
                    if (req.body.startDate && req.body.endDate) {
                        matched = material.priceHistory.find(priceItem =>
                            req.body.startDate >= priceItem.startDate && req.body.endDate <= priceItem.endDate
                        );
                    } else {
                        matched = material.priceHistory.find(priceItem =>
                            todayStr >= priceItem.startDate && todayStr <= priceItem.endDate
                        );
                    }
                }

                return {
                    material: doc.material,
                    quantity: Number(doc.quantity),
                    price: matched.price,
                    cost: (matched.price || 0) * Number(doc.quantity || 0)
                };
            })
        );
        const totalUsedCost= processedMaterials.reduce((sum, item) => sum + item.cost, 0)
        const updateData = await MaterialCostUsed.findByIdAndUpdate(req.params.id, {
            ...req.body,
            totalUsedCost,
            materials: processedMaterials
        }, { new: true })
        if (!updateData) {
            return res.status(404).json({ status: 'error', message: 'Sửa thất bại' })
        }
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
                    startDate: doc.startDate, // Tạm thời là startDate đầu tiên
                    endDate: doc.endDate,     // Tạm thời là endDate đầu tiên
                    group: []
                });
            }

            const groupedDoc = groupedMap.get(scopeId);

            // Cập nhật khoảng thời gian tổng
            // Chuyển sang Date object để so sánh
            const currentStartDate = new Date(groupedDoc.startDate);
            const currentEndDate = new Date(groupedDoc.endDate);
            const docStartDate = new Date(doc.startDate);
            const docEndDate = new Date(doc.endDate);

            if (docStartDate < currentStartDate) {
                groupedDoc.startDate = doc.startDate;
            }
            if (docEndDate > currentEndDate) {
                groupedDoc.endDate = doc.endDate;
            }

            const groupMaterialMap = {};
            doc.materials.map((mat) => {
                const material = mat.material;

                const assignmentCode = material?.assignmentCode?.code || "";

                if (!groupMaterialMap[assignmentCode]) {
                    groupMaterialMap[assignmentCode] = {
                        assignmentCode: material?.assignmentCode,
                        materials: []
                    };
                }
                groupMaterialMap[assignmentCode].materials.push({
                    ...mat,
                    material
                });
            })
            const materials = Object.values(groupMaterialMap);
            // Thêm dữ liệu vào mảng 'group'
            groupedDoc.group.push({
                _id: doc._id,
                startDate: doc.startDate,
                endDate: doc.endDate,
                totalUsedCost: doc.totalUsedCost,
                phases: doc.phases,
                materials: materials
            });
        }

        // Chuyển Map thành mảng
        const results = Array.from(groupedMap.values());

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
