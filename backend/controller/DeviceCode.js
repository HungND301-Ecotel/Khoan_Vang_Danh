const DeviceCode = require('../model/DeviceCode')
const { configExport } = require('../utils/config_export')
const ExcelJS = require('exceljs')


exports.create = async (req, res) => {
    try {
        const { code } = req.body
        const newDeviceCode = new DeviceCode({ code })
        await newDeviceCode.save()
        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const updateData = await DeviceCode.findByIdAndUpdate(req.params.id, req.body, { new: true })
        if (!updateData) {
            return res.status(404).json({ status: 'error', message: 'Sửa thất bại' })
        }
        res.status(200).json({ status: 'success', message: 'Sửa thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.delete = async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
    }

    const result = await DeviceCode.deleteMany({ _id: { $in: ids } });
    if (result.deletedCount === 0) {
        return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
    }

    res.status(200).json({
        status: 'success',
        message: `Đã xóa ${result.deletedCount} bản ghi`
    });
}

exports.get = async (req, res) => {
    try {
        let query = {}
        if (req.query.q) {
            query.code = new RegExp(req.query.q, 'i')
        }
        const data = await DeviceCode.find(query)

        res.status(200).json({ status: 'success', data: data })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}


exports.export = async (req, res) => {
    try {
        const data = await DeviceCode.find();

        const columns = [
            { header: "Mã", key: "_id", width: 20 },
            { header: "Thiết bị", key: "code", width: 20 }
        ]

        const formated = (data || []).map(devicecode => ({
            _id: devicecode._id,
            code: devicecode?.code || ''
        }))

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('ma_thiet_bi');

        // 🧩 1️⃣ Thêm dữ liệu chính TRƯỚC
        worksheet.columns = columns;
        worksheet.addRows(formated);

        const MAX = Math.max(worksheet.rowCount + 100, 1000);

        const buffer = await configExport(workbook, worksheet, [], MAX);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + `ma_thiet_bi.xlsx`);
        res.send(buffer);
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}