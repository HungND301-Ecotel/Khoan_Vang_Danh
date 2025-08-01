const MaterialBudget = require('../model/MaterialBudget')
const MaterialAssignment = require('../model/MaterialAssignment')
const recalculateAssignmentCodePrice = require('./recalculateAssignmentCodePrice')

exports.create = async (req, res) => {
    try {
        const { code, phaseGroup, phase, assignmentNormCode, adjustmentNormCode, production } = req.body
        const newMaterialBudget = new MaterialBudget({ code, phaseGroup, phase, assignmentNormCode, adjustmentNormCode, production })
        await newMaterialBudget.save()
        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const updateData = await MaterialBudget.findByIdAndUpdate(req.params.id, req.body, { new: true })
        if (!updateData) {
            return res.status(404).json({ status: 'error', message: 'Sửa thất bại' })
        }
        res.status(200).json({ status: 'success', message: 'Sửa thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.delete = async (req, res) => {
    try {
        const deleteData = await MaterialBudget.findByIdAndDelete(req.params.id)
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
        const data = await MaterialBudget.find()

        res.status(200).json({ status: 'success', data: data })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.getOne = async (req, res) => {
    try {
        const materialbudget = await MaterialBudget.findById(req.params.id)
            .populate('phase')
            .populate('phaseGroup')
            .populate({
                path: 'assignmentNormCode',
                populate: {
                    path: 'norms.assignmentCode',
                    populate: {
                        path: 'uom'
                    }
                }
            })
            .populate({
                path: 'adjustmentNormCode',
                populate: {
                    path: 'norms.assignmentCode',
                    populate: {
                        path: 'uom'
                    }
                }
            })

        const assignmentNorms = materialbudget.assignmentNormCode?.norms || [];
        const adjustmentNorms = materialbudget.adjustmentNormCode?.norms || [];
        const todayStr = new Date().toISOString().split('T')[0];

        const result = [];

        for (const norm of assignmentNorms) {
            const assignment = norm.assignmentCode;
            if (!assignment?._id) continue;
            await recalculateAssignmentCodePrice(assignment._id);



            const adjustmentNorm = adjustmentNorms.find(a => (
                a.assignmentCode?._id?.toString() === assignment._id.toString()
            ));

            const materials = await MaterialAssignment.find({ assignmentCode: assignment._id }).populate('uom');

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

            const totalNorm = norm.norm && adjustmentNorm?.norm ? norm.norm * adjustmentNorm.norm : 0
            const quantity = totalNorm * materialbudget.production
            const cost = quantity * (assignment.price || 0)
            result.push({
                _id: assignment._id,
                name: assignment.name,
                code: assignment.code,
                uom: assignment.uom?.name,
                price: assignment.price,
                assignmentNorm: norm?.norm,
                adjustmentNorm: adjustmentNorm?.norm,
                totalNorm: totalNorm,
                quantity: totalNorm * materialbudget.production,
                cost: cost,
                materials: materialsWithPrice
            });
        }


        res.status(200).json({
            status: 'success', data: {
                materialbudget,
                assignments: result
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

