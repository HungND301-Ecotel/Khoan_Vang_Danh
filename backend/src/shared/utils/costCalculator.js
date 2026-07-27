const AssignmentNorm = require('../../modules/norm/assignment-norm/assignment-norm.model');
const { recalculateAssignmentCodePrice } = require('./priceCalculator');

/**
 * Tính toán chi phí cho một phase
 * @param {Object} data - Dữ liệu đầu vào { assignmentCodes, production, assignmentNormCode, ... }
 * @param {string} month - Tháng (YYYY-MM)
 * @param {string} type - Loại: "initial" | "used" | "budget"
 * @param {Object} session - MongoDB session (optional)
 * @returns {Object} Dữ liệu đã tính toán với details và totalCost
 */
const calculatedPhase = async (data, month, type, session = null) => {
  let query = AssignmentNorm.findById(data.assignmentNormCode);
  if (session) query = query.session(session);
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
      const isCoalType = ['coal_kb', 'coal_zh', 'coal_zry'].includes(assignmentDoc?.type);
      const quantity = isCoalType ? (norm * phaseQuantity) / 1000 : norm * phaseQuantity;

      const price = await recalculateAssignmentCodePrice(assignmentId, month, session);
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

  const totalCostKey = type === 'initial' ? 'totalInitialPlannedCost' : type === 'used' ? 'totalUsedCost' : 'totalBudgetCost';
  const detailKey = type === 'initial' ? 'initialPlannedCostDetails' : type === 'used' ? 'usedCostDetails' : 'budgetCostDetails';

  return {
    ...data,
    [totalCostKey]: total,
    [detailKey]: details,
  };
};

module.exports = { calculatedPhase };
