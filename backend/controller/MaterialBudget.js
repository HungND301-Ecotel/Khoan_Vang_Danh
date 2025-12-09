const MaterialBudget = require('../model/MaterialBudget')
const MaterialAssignment = require('../model/MaterialAssignment')
const { updatePriceAssignmentCode } = require('../utils/recalculateAssignmentCodePrice')
const ProductionScope = require('../model/ProductionScope')

exports.create = async (req, res) => {
    try {
        const { code, phaseGroup, phase, assignmentNormCode, adjustmentNormCode, production } = req.body
        const newMaterialBudget = new MaterialBudget({ code, phaseGroup, phase, assignmentNormCode, adjustmentNormCode, production })
        await newMaterialBudget.save()
        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const updateData = await MaterialBudget.findByIdAndUpdate(req.params.id, req.body, { new: true })
        if (!updateData) {
            return res.status(404).json({ status: 'error', message: 'Sửa thất bại' })
        }
        res.status(200).json({ status: 'success', message: 'Sửa thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.delete = async (req, res) => {
    try {
        const deleteData = await MaterialBudget.findByIdAndDelete(req.params.id)
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

        // 1. Xử lý điều kiện tìm kiếm theo req.query.q
        if (req.query.q) {
            // Đảm bảo ProductionScope đã được require/import
            const productionScopes = await ProductionScope.find({ code: new RegExp(req.query.q, 'i') })
            const productionScopeIds = productionScopes.map(i => i._id)
            query.productionScope = { $in: productionScopeIds }
        }

        // 2. Thực hiện query với Populate
        // Lấy tất cả dữ liệu liên quan mà không cần nhóm, nhưng giới hạn theo phân trang
        const modelQuery = MaterialBudget.find(query)
            .populate({
                path: 'productionScope',
                select: 'code name phases',
                populate: [
                    { path: 'phases.phase', populate: 'code name' }
                ]
            })
            .populate('phases.phase', 'code name')
            .populate({
                path: 'phases.budgetCostDetails.assignmentCode', // Đường dẫn lồng
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

        // 3. Xử lý dữ liệu bằng JavaScript để nhóm
        const groupedMap = new Map();

        for (const doc of allDocs) {
            const scopeId = doc.productionScope?._id.toString();

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

            // Cập nhật khoảng thời gian tổng
            // Chuyển sang Date object để so sánh
            const currentMonthDate = new Date(doc.month + '-01');

            if (!groupedDoc.minMonth || currentMonthDate < new Date(groupedDoc.minMonth + '-01')) {
                groupedDoc.minMonth = doc.month;
            }
            if (!groupedDoc.maxMonth || currentMonthDate > new Date(groupedDoc.maxMonth + '-01')) {
                groupedDoc.maxMonth = doc.month;
            }

            // Thêm dữ liệu vào mảng 'group'
            groupedDoc.group.push({
                _id: doc._id,
                month: doc.month,
                totalBudgetCost: doc.totalBudgetCost,
                phases: doc.phases?.map((phaseItem) => ({
                    ...phaseItem,
                    key: `${doc._id.toString()}_${phaseItem.phase._id.toString()}`
                }))
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
exports.getOne = async (req, res) => {
    try {
        const materialbudget = await MaterialBudget.findById(req.params.id)
            .populate('phase')
            .populate({
                path: 'assignmentNormCode',
                populate: {
                    path: 'norms.assignmentCode',
                    populate: {
                        path: 'uom'
                    }
                }
            })
            .populate({
                path: 'adjustmentNormCode',
                populate: {
                    path: 'norms.assignmentCode',
                    populate: {
                        path: 'uom'
                    }
                }
            })

        const assignmentNorms = materialbudget.assignmentNormCode?.norms || [];
        const adjustmentNorms = materialbudget.adjustmentNormCode?.norms || [];
        const todayStr = new Date().toISOString().split('T')[0];

        const result = [];

        for (const norm of adjustmentNorms) {
            const assignment = norm.assignmentCode;
            if (!assignment?._id) continue;
            await updatePriceAssignmentCode(assignment._id);



            const adjustmentNorm = assignmentNorms.find(a => (
                a.assignmentCode?._id?.toString() === assignment._id.toString()
            ));


            const materials = await MaterialAssignment.find({ assignmentCode: assignment._id }).populate('uom');

            const materialsWithPrice = materials.map(item => {
                let currentPrice = null;

                if (Array.isArray(item.priceHistory)) {
                    const matched = item.priceHistory.find(priceItem => {
                        return todayStr >= priceItem.startDate && todayStr <= priceItem.endDate;
                    });

                    if (matched) currentPrice = matched.price;
                }

                return {
                    ...item.toObject(),
                    currentPrice
                };
            });

            const totalNorm = norm.norm && adjustmentNorm?.norm ? norm.norm * adjustmentNorm.norm : 0
            const quantity = totalNorm * materialbudget.production
            const cost = quantity * (assignment.price || 0)
            result.push({
                _id: assignment._id,
                name: assignment.name,
                code: assignment.code,
                uom: assignment.uom?.name,
                price: assignment.price,
                assignmentNorm: norm?.norm,
                adjustmentNorm: adjustmentNorm?.norm,
                totalNorm: totalNorm,
                quantity: totalNorm * materialbudget.production,
                cost: cost,
                materials: materialsWithPrice
            });
        }


        res.status(200).json({
            status: 'success', data: {
                materialbudget,
                assignments: result
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

