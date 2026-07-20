const AssignmentCode = require("../model/AssignmentCode");
const MaterialAssignment = require("../model/MaterialAssignment");
const AssignmentNorm = require("../model/AssignmentNorm");

const monthToNumber = (month) => (month ? Number(month.replace("-", "")) : "");

const recalculateAssignmentCodePrice = async (
  assignmentCodeId,
  startDate,
  endDate,
  month,
  session = null,
) => {
  let query = MaterialAssignment.find({
    assignmentCode: assignmentCodeId,
  });

  if (session) {
    query = query.session(session);
  }

  const allMaterials = await query;
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
const updatePriceAssignmentCode = async (assignmentCodeId, session = null) => {
  const result = await recalculateAssignmentCodePrice(
    assignmentCodeId,
    null,
    null,
    null,
    session,
  );
  await AssignmentCode.findByIdAndUpdate(
    assignmentCodeId,
    { price: result },
    { session },
  );
};

const calculatedPhase = async (data, month, type, session = null) => {
  let query = AssignmentNorm.findById(data.assignmentNormCode);

  if (session) {
    query = query.session(session);
  }

  const assignmentDoc = await query.lean();

  const details = [];
  let total = 0;

  if (data.assignmentCodes && Array.isArray(data.assignmentCodes)) {
    for (const inputCodeData of data.assignmentCodes) {
      const assignmentId = inputCodeData.assignmentCode?._id
        ? inputCodeData.assignmentCode._id.toString()
        : inputCodeData.assignmentCode?.toString();

      if (!assignmentId) continue;

      const baseNorm = inputCodeData.baseNorm || 0;
      const adjustmentNorm = inputCodeData.adjustmentNorm || 1;
      const norm = inputCodeData.norm || 0;

      const phaseQuantity = data.production || 0;
      const isCoalType = ["coal_kb", "coal_zh", "coal_zry"].includes(
        assignmentDoc?.type,
      );
      const quantity = isCoalType
        ? (norm * phaseQuantity) / 1000
        : norm * phaseQuantity;

      const price = await recalculateAssignmentCodePrice(
        assignmentId,
        null,
        null,
        month,
      );

      const cost = (price || 0) * (quantity || 0);
      total += cost;

      details.push({
        assignmentCode: assignmentId,
        baseNorm,
        adjustmentNorm,
        norm,
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
  const detailKey =
    type === "initial"
      ? "initialPlannedCostDetails"
      : type === "used"
        ? "usedCostDetails"
        : "budgetCostDetails";

  return {
    ...data,
    [totalCostKey]: total,
    [detailKey]: details,
  };
};
module.exports = {
  recalculateAssignmentCodePrice,
  updatePriceAssignmentCode,
  calculatedPhase,
};
