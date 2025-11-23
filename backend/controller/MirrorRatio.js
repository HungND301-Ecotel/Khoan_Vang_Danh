const MirrorRatio = require('../model/MirrorRatio')
const ExcelJS = require('exceljs')
const { configExport } = require('../utils/config_export')
const { paginateQuery } = require('../utils/pagination')

exports.create = async (req, res) => {
    try {
        const { name } = req.body
        const newMirrorRatio = new MirrorRatio({ name })
        await newMirrorRatio.save()
        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const updateData = await MirrorRatio.findByIdAndUpdate(req.params.id, req.body, { new: true })
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
        const deleteData = await MirrorRatio.findByIdAndDelete(req.params.id)
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
            query.name = new RegExp(req.query.q, 'i')
        }
        const modelQuery = MirrorRatio.find(query)
        const pagination = await paginateQuery(MirrorRatio, modelQuery, query, req.query)

        res.status(200).json({ status: 'success', data: pagination })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.export = async (req, res) => {
    try {
        const data = await MirrorRatio.find();

        const columns = [
            { header: "Mã", key: "_id", width: 20 },
            { header: "Tỉ lệ gương than mềm", key: "name", width: 20 }
        ]

        const formated = (data || []).map(mirrorratio => ({
            _id: mirrorratio._id,
            name: mirrorratio?.name || ''
        }))
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('ti_le_guong_than_mem');

        // 🧩 1️⃣ Thêm dữ liệu chính TRƯỚC
        worksheet.columns = columns;
        worksheet.addRows(formated);

        const MAX = Math.max(worksheet.rowCount + 100, 1000);

        const buffer = await configExport(workbook, worksheet, [], MAX);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + `ti_le_guong_than_mem.xlsx`);
        res.send(buffer);
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}