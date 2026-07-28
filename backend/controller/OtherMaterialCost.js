const OtherMaterialCost = require('../model/OtherMaterialCost')
const MaterialAssignment = require('../model/MaterialAssignment')
const { recalculateAssignmentCodePrice } = require('../utils/recalculateAssignmentCodePrice')
const { dateToNumber } = require('../utils/helpers')

/**
 * Chuyển month (yyyy-MM) + day (number) sang dd/MM/yyyy
 * Ví dụ: month="2026-05", day=15 → "15/05/2026"
 */
const monthDayToDate = (month, day) => {
    if (!month) return null;
    // Đảm bảo month là string
    const monthStr = String(month);
    if (!monthStr.includes('-')) return null;
    const [year, m] = monthStr.split('-');
    const d = day ? String(day).padStart(2, '0') : '01';
    return `${d}/${m}/${year}`;
};

exports.get = async (req, res) => {
    try {
        const { department, month } = req.query;
        const filter = {};

        if (department) filter.department = department;
        if (month) filter.month = month;

        const data = await OtherMaterialCost.find(filter)
            .populate('department', 'code name')
            .populate({
                path: 'materials.material',
                populate: [
                    { path: 'uom', select: 'name' },
                    { path: 'assignmentCode', select: 'code name uom', populate: 'uom' }
                ]
            })
            .sort({ date: 1, shift: 1 });

        res.status(200).json({ status: 'success', data });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { department, month, date, shift, materials } = req.body

        const checkDate = monthDayToDate(month, date);
        const checkDateNum = dateToNumber(checkDate);

        const processedMaterials = await Promise.all(
            materials.map(async (doc) => {
                const material = await MaterialAssignment.findById(doc?.material);
                let matched = null;

                if (material && Array.isArray(material.priceHistory) && checkDate) {
                    matched = material.priceHistory.find(priceItem => {
                        const start = dateToNumber(priceItem.startDate)
                        const end = dateToNumber(priceItem.endDate)
                        return start <= checkDateNum && checkDateNum <= end
                    });
                }
                const priceResult = await recalculateAssignmentCodePrice(
                    material?.assignmentCode,
                    null,
                    null,
                    checkDate,
                );

                // Chi phí thực hiện: dùng executionPrice
                let price = 0;
                if (material?.assignmentCode) {
                    price = priceResult?.executionPrice ?? 0;
                } else if (matched) {
                    price = matched.executionPrice ?? 0;
                }
                return {
                    material: doc.material,
                    quantity: Number(doc.quantity),
                    price: price || 0,
                    cost: (price || 0) * Number(doc.quantity || 0)
                };
            })
        );
        const totalUsedCost = processedMaterials.reduce((sum, item) => sum + item.cost, 0)

        const newOtherMaterialCost = new OtherMaterialCost({
            department,
            month,
            date,
            shift,
            materials: processedMaterials,
            totalUsedCost
        })
        await newOtherMaterialCost.save()

        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const { department, month, date, shift, materials } = req.body

        const checkDate = monthDayToDate(month, date);
        const checkDateNum = dateToNumber(checkDate);

        const processedMaterials = await Promise.all(
            materials.map(async (doc) => {
                const material = await MaterialAssignment.findById(doc?.material);
                let matched = null;

                if (material && Array.isArray(material.priceHistory) && checkDate) {
                    matched = material.priceHistory.find(priceItem => {
                        const start = dateToNumber(priceItem.startDate)
                        const end = dateToNumber(priceItem.endDate)
                        return start <= checkDateNum && checkDateNum <= end
                    });
                }
                const priceResult = await recalculateAssignmentCodePrice(
                    material?.assignmentCode,
                    null,
                    null,
                    checkDate,
                );

                // Chi phí thực hiện: dùng executionPrice
                let price = 0;
                if (material?.assignmentCode) {
                    price = priceResult?.executionPrice ?? 0;
                } else if (matched) {
                    price = matched.executionPrice ?? 0;
                }
                return {
                    material: doc.material,
                    quantity: Number(doc.quantity),
                    price: price || 0,
                    cost: (price || 0) * Number(doc.quantity || 0)
                };
            })
        );
        const totalUsedCost = processedMaterials.reduce((sum, item) => sum + item.cost, 0)

        const updateData = await OtherMaterialCost.findByIdAndUpdate(req.params.id, {
            department, month, date, shift, materials: processedMaterials, totalUsedCost
        }, { new: true })

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
        const deleteData = await OtherMaterialCost.findByIdAndDelete(req.params.id)
        if (!deleteData) {
            return res.status(404).json({ status: 'error', message: 'Xóa thất bại' })
        }
        res.status(200).json({ status: 'success', message: 'Xóa thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}
