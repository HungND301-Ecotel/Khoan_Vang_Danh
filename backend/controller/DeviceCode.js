const DeviceCode = require('../model/DeviceCode')
const { configExport } = require('../utils/config_export')
const ExcelJS = require('exceljs')
const xlsx = require('xlsx')
const { paginateQuery } = require('../utils/pagination')


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
        let modelQuery = DeviceCode.find(query)

        const pagination = await paginateQuery(DeviceCode, modelQuery, query, req.query)

        res.status(200).json({ status: 'success', data: pagination })
    } catch (err) {
        console.log(err.message)
        res.status(500).json({ status: 'error', message: err.message })
    }
}
const columnMapping = {
    'Thiết bị': 'code',
};
exports.import = async (req, res) => {
    try {
        const user = req.user;
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng chọn file' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const headers = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0, raw: true })[0];
        const mappedHeaders = headers.map(header => columnMapping[header] || header);
        const data = xlsx.utils.sheet_to_json(worksheet, { header: mappedHeaders, range: 1 });
        const dataImport = data.filter(row => row.code);

        if (dataImport.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Không tìm thấy dữ liệu hợp lệ trong file.' });
        }

        const operations = dataImport.map(item => {
            const { code, ...updateData } = item;

            if (code) { // Kiểm tra nếu có trường 'name'
                return {
                    updateOne: {
                        filter: { code: code }, // Sửa từ 'cleanedId' thành 'name'
                        update: { $set: updateData }, // Sử dụng $set để cập nhật dữ liệu
                        upsert: true
                    }
                };
            } else {
                return {
                    insertOne: {
                        document: item
                    }
                };
            }
        });

        await DeviceCode.bulkWrite(operations);
        res.status(200).json({
            status: 'success',
            message: `Import file thành công. Đã xử lý ${dataImport.length} bản ghi.`,
        });
    } catch (error) {
        console.log(error.stack)
        res.status(500).json({
            status: 'error',
            message: 'Tải thất bại',
            error: error.message
        });
    }
};

exports.export = async (req, res) => {
    try {
        const data = await DeviceCode.find();

        const columns = [
            { header: "Thiết bị", key: "code", width: 20 }
        ]

        const formated = (data || []).map(devicecode => ({
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