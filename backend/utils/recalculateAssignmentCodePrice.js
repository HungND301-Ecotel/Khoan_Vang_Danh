const AssignmentCode = require("../model/AssignmentCode");
const MaterialAssignment = require("../model/MaterialAssignment");
const AssignmentNorm = require("../model/AssignmentNorm");
const AdjustmentNorm = require("../model/AdjustmentNorm");

const monthToNumber = (month) => (month ? Number(month.replace("-", "")) : "");

const recalculateAssignmentCodePrice = async (
  assignmentCodeId,
  startDate,
  endDate,
  month,
) => {
  const allMaterials = await MaterialAssignment.find({
    assignmentCode: assignmentCodeId,
  });
  if (allMaterials.length === 0) {
    return;
  }

  // const todayStr = new Date().toISOString().split('T')[0];

  const today = new Date();
  const currentYearMonth = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;

  const currentMonthNum = monthToNumber(currentYearMonth);

  let totalQty = 0;
  let totalValue = 0;

  for (const material of allMaterials) {
    let matchedPrice = null;

    if (Array.isArray(material.priceHistory)) {
      if (month) {
        matchedPrice = material.priceHistory.find((priceItem) => {
          const start = monthToNumber(priceItem.startMonth);
          const end = monthToNumber(priceItem.endMonth);
          const checkMonth = monthToNumber(month);
          return start <= checkMonth && checkMonth <= end;
        });
      } else {
        matchedPrice = material.priceHistory.find((priceItem) => {
          const start = monthToNumber(priceItem.startMonth);
          const end = monthToNumber(priceItem.endMonth);
          return start <= currentMonthNum && currentMonthNum <= end;
        });
      }
    }

    const price = matchedPrice?.price || 0;
    const qty = material.quantity || 0;

    totalQty += qty;
    totalValue += qty * price;
  }

  const averagePrice = totalQty > 0 ? Math.round(totalValue / totalQty) : null;

  return averagePrice;
};
const updatePriceAssignmentCode = async (assignmentCodeId) => {
  const result = await recalculateAssignmentCodePrice(
    assignmentCodeId,
    null,
    null,
    null,
  );
  await AssignmentCode.findByIdAndUpdate(assignmentCodeId, { price: result });
};

const calculatedPhases = async (phases, month, type) => {
  const calculatedPhases = [];

  for (const phaseData of phases) {
    // Vẫn cần AssignmentNorm để kiểm tra loại than (coal_type) phục vụ tính toán số lượng
    const assignmentDoc = await AssignmentNorm.findById(
      phaseData.assignmentNormCode,
    ).lean();

    const phaseDetails = [];
    let total = 0;

    if (phaseData.assignmentCodes && Array.isArray(phaseData.assignmentCodes)) {
      for (const inputCodeData of phaseData.assignmentCodes) {
        const assignmentId = inputCodeData.assignmentCode?._id
          ? inputCodeData.assignmentCode._id.toString()
          : inputCodeData.assignmentCode?.toString();

        if (!assignmentId) continue;

        const baseNorm = inputCodeData.baseNorm || 0;
        const adjustmentNorm = inputCodeData.adjustmentNorm || 1;
        const norm = inputCodeData.norm || 0;

        // B. Tính Số lượng (Quantity)
        const phaseQuantity = phaseData.production || 0;
        const isCoalType = ["coal_kb", "coal_zh", "coal_zry"].includes(
          assignmentDoc?.type,
        );
        const quantity = isCoalType
          ? (norm * phaseQuantity) / 1000
          : norm * phaseQuantity;

        // C. Tính Đơn giá bình quân (Price)
        const price = await recalculateAssignmentCodePrice(
          assignmentId,
          null,
          null,
          month,
        );

        // D. Tính Chi phí (Cost)
        const cost = (price || 0) * (quantity || 0);
        total += cost;

        phaseDetails.push({
          assignmentCode: assignmentId,
          baseNorm: baseNorm,
          adjustmentNorm: adjustmentNorm,
          norm: norm,
          quantity: quantity || 0,
          price: price || 0,
          cost: cost || 0,
        });
      }
    }

    const totalCostKey =
      type === "initial"
        ? "totalInitialPlannedCost"
        : type === "used"
          ? "totalUsedCost"
          : "totalBudgetCost";
    const detail =
      type === "initial"
        ? "initialPlannedCostDetails"
        : type === "used"
          ? "usedCostDetails"
          : "budgetCostDetails";

    calculatedPhases.push({
      ...phaseData,
      [totalCostKey]: total,
      [detail]: phaseDetails,
    });
  }
  return calculatedPhases;
};
module.exports = {
  recalculateAssignmentCodePrice,
  updatePriceAssignmentCode,
  calculatedPhases,
};
