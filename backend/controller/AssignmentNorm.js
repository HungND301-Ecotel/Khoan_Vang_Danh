const AssignmentNorm = require('../model/AssignmentNorm')


exports.create = async (req, res) => {
    try {
        const { code, phaseGroup, phase, excavationTech, step, length, cutting, crossSection, type, curbSlope, hardness, thickness, norms } = req.body
        const newAssignmentNorm = new AssignmentNorm({ code, phaseGroup, phase, excavationTech, step, length, cutting, crossSection, type, curbSlope, hardness, thickness, norms })
        await newAssignmentNorm.save()
        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const updateData = await AssignmentNorm.findByIdAndUpdate(req.params.id, req.body, { new: true })
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
        const deleteData = await AssignmentNorm.findByIdAndDelete(req.params.id)
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
        const data = await AssignmentNorm.find()
            .populate('phaseGroup')
            .populate('phase')
            .populate('excavationTech')
            .populate('step')
            .populate('length')
            .populate('cutting')
            .populate({
                path: 'crossSection',
                populate: 'uom'
            })
            .populate('curbSlope')
            .populate('hardness')
            .populate('thickness')
            .populate({
                path: 'norms.assignmentCode',
                populate: 'uom'
            })

        res.status(200).json({ status: 'success', data: data })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

