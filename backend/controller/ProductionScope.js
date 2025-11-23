const ProductionScope = require('../model/ProductionScope')
const { paginateQuery } = require('../utils/pagination')

exports.create = async (req, res) => {
    try {
        const { code, name, phases } = req.body
        const newProductionScope = new ProductionScope({ code, name, phases })
        await newProductionScope.save()
        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const updateData = await ProductionScope.findByIdAndUpdate(req.params.id, req.body, { new: true })
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
        const deleteData = await ProductionScope.findByIdAndDelete(req.params.id)
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
            query.$or = [
                { code: new RegExp(req.query.q, 'i') },
                { name: new RegExp(req.query.q, 'i') }
            ]
        }
        const modelQuery = ProductionScope.find(query)
            .populate('phases.phase')
        const pagination = await paginateQuery(ProductionScope, modelQuery, query, req.query)

        res.status(200).json({ status: 'success', data: pagination })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}

