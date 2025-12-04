const AssignmentCode = require('../model/AssignmentCode')
const MaterialAssignment = require('../model/MaterialAssignment')


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
module.exports = {
    recalculateAssignmentCodePrice,
    updatePriceAssignmentCode
}
