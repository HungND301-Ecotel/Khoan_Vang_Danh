const InitialPlannedCost = require('../model/InitialPlannedCost')
const ProductionScope = require('../model/ProductionScope')
const { paginateQuery } = require('../utils/pagination')
const { recalculateAssignmentCodePrice } = require('../utils/recalculateAssignmentCodePrice')
const AssignmentCode = require('../model/AssignmentCode')
const AssignmentNorm = require('../model/AssignmentNorm')
const AdjustmentNorm = require('../model/AdjustmentNorm')


exports.create = async (req, res) => {
    try {
        const { productionScope, startDate, endDate, phases } = req.body;

        const calculatedPhases = [];

        for (const phaseData of phases) {

            // 1. Lấy dữ liệu Assignment Norm và Adjustment Norm
            const assignmentDoc = await AssignmentNorm.findById(phaseData.assignmentNormCode)
                .populate('norms.assignmentCode')
                .lean();


            const adjustmentDoc = await AdjustmentNorm.findById(phaseData.adjustmentNormCode)
                .populate('norms.assignmentCode')
                .lean();

            // Khởi tạo Map và Set để quản lý dữ liệu
            const assignmentNormsMap = new Map(); // Lưu trữ Base Norm: assignmentId -> normValue
            const adjustmentFactorsMap = new Map(); // Lưu trữ Adjustment Factor: assignmentId -> factorValue
            const uniqueAssignmentCodeIds = new Set(); // Lưu trữ tất cả IDs duy nhất

            // Thu thập Base Norms và IDs
            if (assignmentDoc && assignmentDoc.norms) {
                assignmentDoc.norms.forEach(n => {
                    const id = n.assignmentCode._id.toString();
                    assignmentNormsMap.set(id, n.norm || 0);
                    uniqueAssignmentCodeIds.add(id);
                });
            }

            // Thu thập Adjustment Factors và IDs
            if (adjustmentDoc && adjustmentDoc.norms) {
                adjustmentDoc.norms.forEach(n => {
                    const id = n.assignmentCode._id.toString();
                    adjustmentFactorsMap.set(id, n.norm || 1); // Hệ số mặc định là 1 nếu thiếu
                    uniqueAssignmentCodeIds.add(id);
                });
            }

            const phaseDetails = []; // Mảng chứa chi tiết tính toán cho từng assignmentCode trong phase này
            let totalPhasePlannedCost = 0; // Tổng chi phí kế hoạch của cả phase

            // 2. Lặp qua tất cả AssignmentCode IDs duy nhất (Sử dụng for...of để dùng await)
            for (const assignmentId of uniqueAssignmentCodeIds) {
                const baseNorm = assignmentNormsMap.get(assignmentId) || 0;
                // Nếu adjustmentFactor không tồn tại trong Adjustment Map, mặc định là 1
                const adjustmentNorm = adjustmentFactorsMap.get(assignmentId) || 0;

                // A. Tính Định mức cuối cùng (Norm)
                const norm = baseNorm * adjustmentNorm;

                // B. Tính Số lượng (Quantity)
                // Giả định: Số lượng = Định mức * Sản lượng/Số lượng của Phase
                // phaseData.production hoặc phaseData.quantity (dùng phaseData.production theo code cũ)
                const phaseQuantity = phaseData.production || 0;
                const quantity = (norm * phaseQuantity).toFixed(1);

                // C. Tính Đơn giá bình quân (Price)
                // Phải dùng await ở đây!
                const price = await recalculateAssignmentCodePrice(assignmentId, startDate, endDate);

                // D. Tính Chi phí (Cost)
                const cost = price * quantity || 0;
                totalPhasePlannedCost += cost;

                // Lưu chi tiết cho phase (dùng cho plannedCost array)
                phaseDetails.push({
                    assignmentCode: assignmentId,
                    baseNorm: baseNorm,
                    adjustmentNorm: adjustmentNorm,
                    norm: norm,
                    quantity: quantity,
                    price: price, // Đơn giá bình quân
                    cost: cost, // Chi phí kế hoạch chi tiết
                });
            }

            // 3. Chuẩn bị dữ liệu cho InitialPlannedCost
            calculatedPhases.push({
                ...phaseData,
                // Lưu lại tổng chi phí (hoặc chi tiết nếu schema cho phép)
                totalPlannedCost: totalPhasePlannedCost,
                // Lưu chi tiết định mức/chi phí nếu bạn muốn hiển thị bảng con chi tiết
                plannedCostDetails: phaseDetails,
            });
        }
        const totalPlannedCost = calculatedPhases.reduce((sum, item) => sum + item.totalPlannedCost, 0)


        // Tạo đối tượng InitialPlannedCost mới
        const newInitialPlannedCost = new InitialPlannedCost({
            productionScope,
            startDate,
            endDate,
            phases: calculatedPhases, // Dùng mảng đã tính toán
            totalPlannedCost
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
        const calculatedPhases = [];

        for (const phaseData of req.body.phases) {

            // 1. Lấy dữ liệu Assignment Norm và Adjustment Norm
            const assignmentDoc = await AssignmentNorm.findById(phaseData.assignmentNormCode)
                .populate('norms.assignmentCode')
                .lean();

            const adjustmentDoc = await AdjustmentNorm.findById(phaseData.adjustmentNormCode)
                .populate('norms.assignmentCode')
                .lean();

            // Khởi tạo Map và Set để quản lý dữ liệu
            const assignmentNormsMap = new Map(); // Lưu trữ Base Norm: assignmentId -> normValue
            const adjustmentFactorsMap = new Map(); // Lưu trữ Adjustment Factor: assignmentId -> factorValue
            const uniqueAssignmentCodeIds = new Set(); // Lưu trữ tất cả IDs duy nhất

            // Thu thập Base Norms và IDs
            if (assignmentDoc && assignmentDoc.norms) {
                assignmentDoc.norms.forEach(n => {
                    const id = n.assignmentCode._id.toString();
                    assignmentNormsMap.set(id, n.norm || 0);
                    uniqueAssignmentCodeIds.add(id);
                });
            }

            // Thu thập Adjustment Factors và IDs
            if (adjustmentDoc && adjustmentDoc.norms) {
                adjustmentDoc.norms.forEach(n => {
                    const id = n.assignmentCode._id.toString();
                    adjustmentFactorsMap.set(id, n.norm || 1); // Hệ số mặc định là 1 nếu thiếu
                    uniqueAssignmentCodeIds.add(id);
                });
            }

            const phaseDetails = []; // Mảng chứa chi tiết tính toán cho từng assignmentCode trong phase này
            let totalPhasePlannedCost = 0; // Tổng chi phí kế hoạch của cả phase

            // 2. Lặp qua tất cả AssignmentCode IDs duy nhất (Sử dụng for...of để dùng await)
            for (const assignmentId of uniqueAssignmentCodeIds) {
                const baseNorm = assignmentNormsMap.get(assignmentId) || 0;
                // Nếu adjustmentFactor không tồn tại trong Adjustment Map, mặc định là 1
                const adjustmentNorm = adjustmentFactorsMap.get(assignmentId) || 0;

                // A. Tính Định mức cuối cùng (Norm)
                const norm = baseNorm * adjustmentNorm;

                // B. Tính Số lượng (Quantity)
                // Giả định: Số lượng = Định mức * Sản lượng/Số lượng của Phase
                // phaseData.production hoặc phaseData.quantity (dùng phaseData.production theo code cũ)
                const phaseQuantity = phaseData.production || 0;
                const quantity = (norm * phaseQuantity).toFixed(1);

                // C. Tính Đơn giá bình quân (Price)
                // Phải dùng await ở đây!
                const price = await recalculateAssignmentCodePrice(assignmentId, req.body.startDate, req.body.endDate);

                // D. Tính Chi phí (Cost)
                const cost = price * quantity || 0;
                totalPhasePlannedCost += cost;

                // Lưu chi tiết cho phase (dùng cho plannedCost array)
                phaseDetails.push({
                    assignmentCode: assignmentId,
                    baseNorm: baseNorm,
                    adjustmentNorm: adjustmentNorm,
                    norm: norm,
                    quantity: quantity,
                    price: price, // Đơn giá bình quân
                    cost: cost, // Chi phí kế hoạch chi tiết
                });
            }

            // 3. Chuẩn bị dữ liệu cho InitialPlannedCost
            calculatedPhases.push({
                ...phaseData,
                // Lưu lại tổng chi phí (hoặc chi tiết nếu schema cho phép)
                totalPlannedCost: totalPhasePlannedCost,
                // Lưu chi tiết định mức/chi phí nếu bạn muốn hiển thị bảng con chi tiết
                plannedCostDetails: phaseDetails,
            });
        }

        const totalPlannedCost = calculatedPhases.reduce((sum, item) => sum + item.totalPlannedCost, 0)

        const updateData = await InitialPlannedCost.findByIdAndUpdate(
            req.params.id,
            { ...req.body, phases: calculatedPhases, totalPlannedCost },
            { new: true })
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
            const ProductionScope = mongoose.model('ProductionScope');
            const productionScopes = await ProductionScope.find({ code: new RegExp(req.query.q, 'i') })
            const productionScopeIds = productionScopes.map(i => i._id)
            query.productionScope = { $in: productionScopeIds }
        }

        // 2. Thực hiện query với Populate
        // Lấy tất cả dữ liệu liên quan mà không cần nhóm, nhưng giới hạn theo phân trang
        const modelQuery = InitialPlannedCost.find(query)
            .populate({
                path: 'productionScope',
                select: 'code name' // Chỉ lấy các trường cần thiết
            })
            .populate('phases.phase', 'code name')
            .populate({
                path: 'phases.plannedCostDetails.assignmentCode', // Đường dẫn lồng
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
                totalPlannedCost: doc.totalPlannedCost,
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const paginatedData = results.slice(startIndex, endIndex);

        const pagination = {
            data: paginatedData,
            page: page,
            totalDocs: totalItems,
            totalPages: Math.ceil(totalItems / limit)
        };

        res.status(200).json({ status: 'success', data: pagination })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}
