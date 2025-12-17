const ExcavationNorm = require('../model/ExcavationNorm')
const { paginateQuery } = require('../utils/pagination')

exports.create = async (req, res) => {
    try {
        const { code, phaseGroup, phase, excavationTech, hardness, step, norms } = req.body
        const exitData = await ExcavationNorm.countDocuments({ code: code })
        if (exitData > 0) {
            return res.status(409).json({ status: 'error', message: `Mã định mức đào lò '${code}' đã tồn tại` })
        }
        const newExcavationNorm = new ExcavationNorm({ code, phaseGroup, phase, excavationTech, hardness, step, norms })
        await newExcavationNorm.save()
        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const updateData = await ExcavationNorm.findByIdAndUpdate(req.params.id, req.body, { new: true })
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
        const deleteData = await ExcavationNorm.findByIdAndDelete(req.params.id)
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
        const modelQuery = await ExcavationNorm.find(query)
            .populate('phase')
            .populate('phaseGroup')
            .populate('excavationTech')
            .populate('hardness')
            .populate('step')
            .populate({
                path: 'norms.assignmentCode',
                populate: 'uom'
            })
        const pagination = await paginateQuery(ExcavationNorm, modelQuery, query, req.query)


        res.status(200).json({ status: 'success', data: pagination })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

