const MaterialAssignment = require('../../modules/material/material-assignment.model');
const AssignmentCode = require('../../modules/assignment-code/assignment-code.model');

/**
 * Chuyển "YYYY-MM" thành số để so sánh
 */
const monthToNumber = (month) => {
  if (!month) return null;
  return Number(month.replace('-', ''));
};

/**
 * Tính giá trung bình có trọng số cho AssignmentCode
 * @param {string} assignmentCodeId - ID của AssignmentCode
 * @param {string} month - Tháng cần tính giá (YYYY-MM)
 * @param {Object} session - MongoDB session (optional, cho transaction)
 * @returns {Promise<number|null>} Giá trung bình hoặc null
 */
const recalculateAssignmentCodePrice = async (assignmentCodeId, month = null, session = null) => {
  let query = MaterialAssignment.find({ assignmentCode: assignmentCodeId });
  if (session) query = query.session(session);

  const allMaterials = await query;
  if (allMaterials.length === 0) return null;

  const today = new Date();
  const currentYearMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
  const currentMonthNum = monthToNumber(month || currentYearMonth);

  let totalQty = 0;
  let totalValue = 0;

  for (const material of allMaterials) {
    let matchedPrice = null;

    if (Array.isArray(material.priceHistory)) {
      matchedPrice = material.priceHistory.find((priceItem) => {
        const start = monthToNumber(priceItem.startMonth);
        const end = monthToNumber(priceItem.endMonth);
        return start <= currentMonthNum && currentMonthNum <= end;
      });
    }

    const price = matchedPrice?.price || 0;
    const qty = material.quantity || 0;

    totalQty += qty;
    totalValue += qty * price;
  }

  return totalQty > 0 ? Math.round(totalValue / totalQty) : null;
};

/**
 * Cập nhật giá cho AssignmentCode
 */
const updatePriceAssignmentCode = async (assignmentCodeId, session = null) => {
  const price = await recalculateAssignmentCodePrice(assignmentCodeId, null, session);
  await AssignmentCode.findByIdAndUpdate(assignmentCodeId, { price }, { session });
  return price;
};

/**
 * Resolve giá cho một material item
 * @param {Object} material - Material document
 * @param {string} month - Tháng cần resolve
 * @returns {number} Giá đã resolve
 */
const resolveMaterialPrice = (material, month) => {
  if (!month || !Array.isArray(material.priceHistory)) return 0;

  const monthNum = monthToNumber(month);
  const matched = material.priceHistory.find((priceItem) => {
    const start = monthToNumber(priceItem.startMonth);
    const end = monthToNumber(priceItem.endMonth);
    return start <= monthNum && monthNum <= end;
  });

  return matched?.price || 0;
};

module.exports = {
  monthToNumber,
  recalculateAssignmentCodePrice,
  updatePriceAssignmentCode,
  resolveMaterialPrice,
};
