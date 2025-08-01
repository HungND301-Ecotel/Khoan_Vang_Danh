const AssignmentCode = require('../model/AssignmentCode')
const MaterialAssignment = require('../model/MaterialAssignment')


const recalculateAssignmentCodePrice = async (assignmentCodeId) => {
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
            matchedPrice = material.priceHistory.find(priceItem => {
                return todayStr >= priceItem.startDate && todayStr <= priceItem.endDate;
            });
        }

        const price = matchedPrice?.price || 0;
        const qty = material.quantity || 0;

        totalQty += qty;
        totalValue += qty * price;
    }

    const averagePrice = totalQty > 0 ? Math.round(totalValue / totalQty) : null;

    await AssignmentCode.findByIdAndUpdate(assignmentCodeId, { price: averagePrice });
};
module.exports = recalculateAssignmentCodePrice
