const AdjustmentNorm = require('../model/AdjustmentNorm')


exports.create = async (req, res) => {
    try {
        const { code, mirrorRatio, hardness, rockRatio, type, norms } = req.body
        const newAdjustmentNorm = new AdjustmentNorm({ code, hardness, mirrorRatio, rockRatio, type, norms })
        await newAdjustmentNorm.save()
        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const updateData = await AdjustmentNorm.findByIdAndUpdate(req.params.id, req.body, { new: true })
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
        const deleteData = await AdjustmentNorm.findByIdAndDelete(req.params.id)
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
        const data = await AdjustmentNorm.find()
            .populate('mirrorRatio')
            .populate('rockRatio')
            .populate('hardness')
            .populate({
                path: 'norms.assignmentCode',
                populate: 'uom'
            })

        res.status(200).json({ status: 'success', data: data })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

