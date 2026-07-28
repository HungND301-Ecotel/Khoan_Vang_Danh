const AssignmentCode = require("../model/AssignmentCode");
const MaterialAssignment = require("../model/MaterialAssignment");
const AssignmentNorm = require("../model/AssignmentNorm");
const { dateToNumber, monthToNumber } = require("./helpers");

/**
 * Tìm priceHistory item phù hợp theo date hoặc month
 * @param {Array} priceHistory - Mảng priceHistory
 * @param {string|null} date - "dd/MM/yyyy" (mode date)
 * @param {string|null} month - "yyyy-MM" (mode month)
 * @returns {object|null} - item phù hợp hoặc null
 */
const findMatchingPrice = (priceHistory, date, month) => {
  if (!Array.isArray(priceHistory) || priceHistory.length === 0) return null;

  if (date) {
    // Mode DATE: so sánh theo ngày dd/MM/yyyy
    const checkDateNum = dateToNumber(date);
    return priceHistory.find((priceItem) => {
      const start = dateToNumber(priceItem.startDate);
      const end = dateToNumber(priceItem.endDate);
      return start <= checkDateNum && checkDateNum <= end;
    });
  }

  if (month) {
    // Mode MONTH: so sánh theo tháng yyyy-MM
    // Lấy item đầu tiên mà tháng nằm trong khoảng startDate~endDate
    const checkMonthNum = monthToNumber(month);
    return priceHistory.find((priceItem) => {
      // Chuyển dd/MM/yyyy → YYYYMM để so sánh
      const startParts = priceItem.startDate.split("/");
      const endParts = priceItem.endDate.split("/");
      const startMonth = Number(`${startParts[2]}${startParts[1]}`);
      const endMonth = Number(`${endParts[2]}${endParts[1]}`);
      return startMonth <= checkMonthNum && checkMonthNum <= endMonth;
    });
  }

  return null;
};

/**
 * Tính đơn giá trung bình của assignmentCode
 * @param {string} assignmentCodeId - ID assignmentCode
 * @param {string|null} startDate - (không dùng, giữ để compat)
 * @param {string|null} endDate - (không dùng, giữ để compat)
 * @param {string|null} dateOrMonth - "dd/MM/yyyy" (date) hoặc "yyyy-MM" (month)
 * @param {object|null} session - MongoDB session
 * @param {boolean} isMonthMode - true nếu truyền month, false nếu truyền date
 * @returns {object|null} - { executionPrice, plannedPrice } hoặc null
 */
const recalculateAssignmentCodePrice = async (
  assignmentCodeId,
  startDate,
  endDate,
  dateOrMonth,
  session = null,
  isMonthMode = false,
) => {
  let query = MaterialAssignment.find({
    assignmentCode: assignmentCodeId,
  });

  if (session) {
    query = query.session(session);
  }

  const allMaterials = await query;
  if (allMaterials.length === 0) {
    return null;
  }

  // Xác định mode và giá trị check
  let checkDate = null;
  let checkMonth = null;

  if (isMonthMode) {
    checkMonth = dateOrMonth;
  } else {
    checkDate = dateOrMonth;
    // Nếu không truyền gì, lấy hôm nay
    if (!checkDate) {
      const today = new Date();
      checkDate = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`;
    }
  }

  let totalQty = 0;
  let totalExecValue = 0;
  let totalPlanValue = 0;

  for (const material of allMaterials) {
    const matchedPrice = findMatchingPrice(
      material.priceHistory,
      checkDate,
      checkMonth,
    );

    const execPrice = matchedPrice?.executionPrice ?? 0;
    const planPrice = matchedPrice?.plannedPrice ?? 0;
    const qty = material.quantity || 0;

    totalQty += qty;
    totalExecValue += qty * execPrice;
    totalPlanValue += qty * planPrice;
  }

  const executionPrice =
    totalQty > 0 ? Math.round(totalExecValue / totalQty) : null;
  const plannedPrice =
    totalQty > 0 ? Math.round(totalPlanValue / totalQty) : null;


  return { executionPrice, plannedPrice };
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
    {
      executionPrice: result?.executionPrice ?? 0,
      plannedPrice: result?.plannedPrice ?? 0,
    },
    { session },
  );
};

const calculatedPhase = async (data, date, type, session = null) => {
  let query = AssignmentNorm.findById(data.assignmentNormCode);

  if (session) {
    query = query.session(session);
  }

  const assignmentDoc = await query.lean();

  const details = [];
  let total = 0;

  // Xác định mode: initial/budget dùng month, used dùng date
  const isMonthMode = type === "initial" || type === "budget";

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

      const priceResult = await recalculateAssignmentCodePrice(
        assignmentId,
        null,
        null,
        date,
        null,
        isMonthMode,
      );

      // Phân biệt theo type:
      // - "initial"/"budget": dùng plannedPrice
      // - "used": dùng executionPrice
      let price = 0;
      if (type === "initial" || type === "budget") {
        price = priceResult?.plannedPrice ?? 0;
      } else {
        price = priceResult?.executionPrice ?? priceResult?.plannedPrice ?? 0;
      }

      const quantityOutside = inputCodeData.quantityOutside || 0;
      const totalQuantity = (quantity || 0) + quantityOutside;
      const cost = price * totalQuantity;
      total += cost;

      details.push({
        assignmentCode: assignmentId,
        baseNorm,
        adjustmentNorm,
        norm,
        quantity: quantity || 0,
        quantityOutside: quantityOutside,
        executionPrice: priceResult?.executionPrice ?? 0,
        plannedPrice: priceResult?.plannedPrice ?? 0,
        price: price,
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
