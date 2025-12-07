const InitialPlannedCost = require('../model/InitialPlannedCost')
const ProductionScope = require('../model/ProductionScope')
const { paginateQuery } = require('../utils/pagination')
const { recalculateAssignmentCodePrice, calculatedPhases } = require('../utils/recalculateAssignmentCodePrice')


exports.create = async (req, res) => {
    try {
        const { productionScope, startDate, endDate, phases } = req.body;

        const result = await calculatedPhases(phases, startDate, endDate, "initial")

        const totalInitialPlannedCost = result.reduce((sum, item) => sum + item.totalInitialPlannedCost, 0)


        // Tạo đối tượng InitialPlannedCost mới
        const newInitialPlannedCost = new InitialPlannedCost({
            productionScope,
            startDate,
            endDate,
            phases: result, // Dùng mảng đã tính toán
            totalInitialPlannedCost
        });

        await newInitialPlannedCost.save();

        res.status(201).json({ status: 'success', message: 'Tạo thành công' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ status: 'error', message: err.message });
    }
};
exports.update = async (req, res) => {
    try {
        const result = await calculatedPhases(req.body.phases, req.body.startDate, req.body.endDate, "initial")

        const totalInitialPlannedCost = result.reduce((sum, item) => sum + item.totalInitialPlannedCost, 0)

        const updateData = await InitialPlannedCost.findByIdAndUpdate(
            req.params.id,
            { ...req.body, phases: result, totalInitialPlannedCost },
            { new: true })
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
        const deleteData = await InitialPlannedCost.findByIdAndDelete(req.params.id)
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
        const modelQuery = InitialPlannedCost.find(query)
            .populate({
                path: 'productionScope',
                select: 'code name phases',
                populate: [
                    { path: 'phases.phase', populate: 'code name' }
                ]
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

            // Thêm dữ liệu vào mảng 'group'
            groupedDoc.group.push({
                _id: doc._id,
                startDate: doc.startDate,
                endDate: doc.endDate,
                totalInitialPlannedCost: doc.totalInitialPlannedCost,
                phases: doc.phases.map((phaseItem) => ({
                    ...phaseItem,
                    key: `${doc._id.toString()}_${phaseItem.phase._id.toString()}`
                }))
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

exports.getOne = async (req, res) => {
    try {

        // 2. Thực hiện query với Populate
        // Lấy tất cả dữ liệu liên quan mà không cần nhóm, nhưng giới hạn theo phân trang
        const scopeId = req.params.productionScope
        const modelQuery = InitialPlannedCost.find({ productionScope: scopeId })
            .populate({
                path: 'productionScope',
                select: 'code name phases',
                populate: [
                    { path: 'phases.phase', populate: 'code name' }
                ]
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
            startDate: allDocs[0]?.startDate, // Tạm thời là startDate đầu tiên
            endDate: allDocs[0]?.endDate,
            group: []
        }

        for (const doc of allDocs) {

            // Cập nhật khoảng thời gian tổng
            // Chuyển sang Date object để so sánh
            const currentStartDate = new Date(data.startDate);
            const currentEndDate = new Date(data.endDate);
            const docStartDate = new Date(doc.startDate);
            const docEndDate = new Date(doc.endDate);

            if (docStartDate < currentStartDate) {
                data.startDate = doc.startDate;
            }
            if (docEndDate > currentEndDate) {
                data.endDate = doc.endDate;
            }

            // Thêm dữ liệu vào mảng 'group'
            data.group.push({
                _id: doc._id,
                startDate: doc.startDate,
                endDate: doc.endDate,
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