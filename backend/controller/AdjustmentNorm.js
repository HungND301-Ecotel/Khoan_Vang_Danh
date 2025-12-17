const AdjustmentNorm = require('../model/AdjustmentNorm')
const { paginateQuery } = require('../utils/pagination')

exports.create = async (req, res) => {
    try {
        const { code, mirrorRatio, hardness, rockRatio, type, norms } = req.body
        const exitAdjustment = await AdjustmentNorm.countDocuments({ code: code })
        if (exitAdjustment > 0) {
            return res.status(409).json({ status: 'error', message: `Mã hệ số điều chỉnh định mức '${code}' đã tồn tại` })
        }
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
        let query = {}
        if (req.query.q) {
            query.code = new RegExp(req.query.q, 'i')
        }
        if (req.query.type) {
            query.type = new RegExp(req.query.type, 'i')
        }
        const modelQuery = AdjustmentNorm.find(query)
            .populate('mirrorRatio')
            .populate('rockRatio')
            .populate('hardness')
            .populate({
                path: 'norms.assignmentCode',
                populate: 'uom'
            })
        const pagination = await paginateQuery(AdjustmentNorm, modelQuery, query, req.query)

        res.status(200).json({ status: 'success', data: pagination })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

