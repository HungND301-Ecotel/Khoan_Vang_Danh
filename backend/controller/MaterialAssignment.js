const MaterialAssignment = require('../model/MaterialAssignment')
const AssignmentCode = require('../model/AssignmentCode')

const recalculateAssignmentCodePrice = require('./recalculateAssignmentCodePrice')


exports.create = async (req, res) => {
    try {
        const { code, name, assignmentCode, uom, quantity, priceHistory } = req.body
        const newMaterialAssignment = new MaterialAssignment({ code, name, assignmentCode, uom, quantity, priceHistory })
        await newMaterialAssignment.save()
        await recalculateAssignmentCodePrice(assignmentCode);
        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const updateData = await MaterialAssignment.findByIdAndUpdate(req.params.id, req.body, { new: true })
        if (!updateData) {
            return res.status(404).json({ status: 'error', message: 'Sửa thất bại' })
        }
        await recalculateAssignmentCodePrice(updateData.assignmentCode);
        res.status(200).json({ status: 'success', message: 'Sửa thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.delete = async (req, res) => {
    try {
        const deleteData = await MaterialAssignment.findByIdAndDelete(req.params.id)
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
        const assignments = await AssignmentCode.find().populate({
            path: 'uom'
        });

        const result = [];

        for (const assignment of assignments) {
            await recalculateAssignmentCodePrice(assignment._id);

            const materials = await MaterialAssignment.find({ assignmentCode: assignment._id }).populate('assignmentCode').populate('uom');

            const todayStr = new Date().toISOString().split('T')[0];

            const materialsWithPrice = materials.map(item => {
                let currentPrice = null;

                if (Array.isArray(item.priceHistory)) {
                    const matched = item.priceHistory.find(priceItem => {
                        return todayStr >= priceItem.startDate && todayStr <= priceItem.endDate;
                    });

                    if (matched) currentPrice = matched.price;
                }

                return {
                    ...item.toObject(),
                    currentPrice
                };
            });

            result.push({
                _id: assignment._id,
                name: assignment.name,
                code: assignment.code,
                uom: assignment.uom?.name,
                price: assignment.price,
                materials: materialsWithPrice
            });
        }

        res.status(200).json({ status: 'success', data: result });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};


exports.getAll = async (req, res) => {
    try {

        const materials = await MaterialAssignment.find().populate('assignmentCode').populate('uom');

        const todayStr = new Date().toISOString().split('T')[0];

        const materialsWithPrice = materials.map(item => {
            let currentPrice = null;

            if (Array.isArray(item.priceHistory)) {
                const matched = item.priceHistory.find(priceItem => {
                    return todayStr >= priceItem.startDate && todayStr <= priceItem.endDate;
                });

                if (matched) currentPrice = matched.price;
            }

            return {
                ...item.toObject(),
                currentPrice
            };
        });

        res.status(200).json({ status: 'success', data: materialsWithPrice });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};