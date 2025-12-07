const AssignmentCode = require('../model/AssignmentCode')
const MaterialAssignment = require('../model/MaterialAssignment')
const AssignmentNorm = require('../model/AssignmentNorm')
const AdjustmentNorm = require('../model/AdjustmentNorm')

const recalculateAssignmentCodePrice = async (assignmentCodeId, startDate, endDate) => {
    const allMaterials = await MaterialAssignment.find({ assignmentCode: assignmentCodeId });
    if (allMaterials.length === 0) {
        return
    }

    const todayStr = new Date().toISOString().split('T')[0];

    let totalQty = 0;
    let totalValue = 0;

    for (const material of allMaterials) {
        let matchedPrice = null;

        if (Array.isArray(material.priceHistory)) {
            if (startDate && endDate) {
                matchedPrice = material.priceHistory.find(priceItem => {
                    return startDate >= priceItem.startDate && endDate <= priceItem.endDate;
                });
            } else {
                matchedPrice = material.priceHistory.find(priceItem => {
                    return todayStr >= priceItem.startDate && todayStr <= priceItem.endDate;
                });
            }
        }

        const price = matchedPrice?.price || 0;
        const qty = material.quantity || 0;

        totalQty += qty;
        totalValue += qty * price;
    }

    const averagePrice = totalQty > 0 ? Math.round(totalValue / totalQty) : null;

    return averagePrice
};
const updatePriceAssignmentCode = async (assignmentCodeId) => {
    const result = await recalculateAssignmentCodePrice(assignmentCodeId, null, null)
    await AssignmentCode.findByIdAndUpdate(assignmentCodeId, { price: result });
}

const calculatedPhases = async (phases, startDate, endDate, type) => {
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
        let total = 0; // Tổng chi phí kế hoạch của cả phase

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
            total += cost;

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
        const totalCostKey = type === "initial"
            ? "totalInitialPlannedCost"
            : type === "used"
                ? "totalUsedCost"
                : "totalBudgetCost"
        const detail = type === "initial"
            ? "initialPlannedCostDetails"
            : type === "used"
                ? "usedCostDetails"
                : "budgetCostDetails"
        // 3. Chuẩn bị dữ liệu cho InitialPlannedCost
        calculatedPhases.push({
            ...phaseData,
            // Lưu lại tổng chi phí (hoặc chi tiết nếu schema cho phép)
            [totalCostKey]: total,
            // Lưu chi tiết định mức/chi phí nếu bạn muốn hiển thị bảng con chi tiết
            [detail]: phaseDetails,
        });
    }
    return calculatedPhases
}
module.exports = {
    recalculateAssignmentCodePrice,
    updatePriceAssignmentCode,
    calculatedPhases
}
