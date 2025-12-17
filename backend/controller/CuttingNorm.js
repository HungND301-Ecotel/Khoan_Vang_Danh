const CuttingNorm = require('../model/CuttingNorm')


exports.create = async (req, res) => {
    try {
        const { code, phaseGroup, phase, hardness, crossSection, norms } = req.body
        const exitData = await CuttingNorm.countDocuments({ code: code })
        if (exitData > 0) {
            return res.status(409).json({ status: 'error', message: `Mã định mức xén lò '${code}' đã tồn tại` })
        }
        const newCuttingNorm = new CuttingNorm({ code, phaseGroup, phase, hardness, crossSection, norms })
        await newCuttingNorm.save()
        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const updateData = await CuttingNorm.findByIdAndUpdate(req.params.id, req.body, { new: true })
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
        const deleteData = await CuttingNorm.findByIdAndDelete(req.params.id)
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
        const data = await CuttingNorm.find()
            .populate('phase')
            .populate('phaseGroup')
            .populate({
                path: 'crossSection',
                populate: 'uom'
            })
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

