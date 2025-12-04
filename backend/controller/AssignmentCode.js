const AssignmentCode = require('../model/AssignmentCode')
const DeviceCode = require('../model/DeviceCode')
const Unit = require('../model/Unit')
const { updatePriceAssignmentCode } = require('../utils/recalculateAssignmentCodePrice')
const ExcelJS = require('exceljs')
const xlsx = require('xlsx')
const { configExport } = require('../utils/config_export')
const { paginateQuery } = require('../utils/pagination')

exports.create = async (req, res) => {
    try {
        const { code, name, uom, price, deviceCode } = req.body
        const newAssignmentCode = new AssignmentCode({ code, name, uom, price, deviceCode })
        await newAssignmentCode.save()
        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const updateData = await AssignmentCode.findByIdAndUpdate(req.params.id, req.body, { new: true })
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
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        const result = await AssignmentCode.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }

        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
        });
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
                { name: new RegExp(req.query.q, 'i') },
            ]
        }
        let queryModel = AssignmentCode.find(query).populate("uom").populate("deviceCode")
        const pagination = await paginateQuery(AssignmentCode, queryModel, query, req.query)
        for (const assignment of pagination.data) {
            await updatePriceAssignmentCode(assignment._id);
        }

        res.status(200).json({ status: 'success', data: pagination })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

const columnMapping = {
    'Thiết bị': 'deviceCode',
    'Mã giao khoán': 'code',
    'Tên giao khoán': 'name',
    'ĐVT': 'uom',
    'Đơn giá': 'price'
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
        const dataImport = data.filter(row => row.code && row.name);

        if (dataImport.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Không tìm thấy dữ liệu hợp lệ trong file.' });
        }
        const uniqueDeviceCodes = [...new Set(dataImport.map(d => d.deviceCode).filter(Boolean))];
        const uniqueUnits = [...new Set(dataImport.map(d => d.uom).filter(Boolean))]

        const [exitingDeviceCodes, exitingUnits] = await Promise.all([
            DeviceCode.find({ code: { $in: uniqueDeviceCodes } }).lean(),
            Unit.find({ name: { $in: uniqueUnits } }).lean()
        ])

        const deviceCodeMap = new Map(exitingDeviceCodes.map(d => [d.code, d._id]))
        const unitMap = new Map(exitingUnits.map(d => [d.name, d._id]))

        const operations = [];
        const invalidRows = [];

        for (const item of dataImport) {
            const { deviceCode, uom, ...updateData } = item
            if (deviceCode) {
                const deviceCodeId = deviceCodeMap.get(deviceCode)
                if (!deviceCodeId) {
                    invalidRows.push({ item, error: `Thiết bị không hợp lệ: ${deviceCode}` })
                    continue
                }
                updateData.deviceCode = deviceCodeId
            }

            if (uom) {
                const unitId = unitMap.get(uom)
                if (!unitId) {
                    invalidRows.push({ item, error: `Đơn vị tính không hợp lệ:${uom}` })
                }
                updateData.uom = unitId
            }

            operations.push({
                updateOne: {
                    filter: {
                        code: item.code,
                        name: item.name
                    },
                    update: { $set: updateData },
                    upsert: true,
                },
            });
        };

        let bulkResult = null;
        if (operations.length > 0) {
            bulkResult = await AssignmentCode.bulkWrite(operations);
        }
        res.status(200).json({
            status: 'success',
            message: 'Import dữ liệu hoàn tất.',
            summary: {
                totalProcessed: dataImport.length,
                insertedCount: bulkResult ? bulkResult.upsertedCount : 0,
                updatedCount: bulkResult ? bulkResult.modifiedCount : 0,
                invalidCount: invalidRows.length,
            },
            invalidRows: invalidRows,
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
        const data = await AssignmentCode.find()
            .populate("uom")
            .populate("deviceCode");

        const columns = [
            { header: "Thiết bị", key: "deviceCode", width: 20 },
            { header: "Mã giao khoán", key: "code", width: 20 },
            { header: "Tên giao khoán", key: "name", width: 20 },
            { header: "ĐVT", key: "uom", width: 20 },
            { header: "Đơn giá", key: "price", width: 20 },
        ];

        const formated = (data || []).map(i => ({
            deviceCode: i?.deviceCode?.code || '',
            code: i?.code || '',
            name: i?.name || '',
            uom: i?.uom?.name || '',
            price: i?.price || '',
        }));

        const deviceCodes = await DeviceCode.find();
        const units = await Unit.find();

        const deviceCodeList = [...new Set(deviceCodes.map(p => p.code).filter(Boolean))];
        const unitList = [...new Set(units.map(d => d.name).filter(Boolean))];

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('ma_giao_khoan');

        // 🧩 1️⃣ Thêm dữ liệu chính TRƯỚC
        worksheet.columns = columns;
        worksheet.addRows(formated);

        const MAX = Math.max(worksheet.rowCount + 100, 1000);

        // 🧩 2️⃣ Sau đó mới thêm các danh sách dropdown
        worksheet.getColumn('X').values = ['deviceCodes', ...deviceCodeList];
        worksheet.getColumn('Y').values = ['units', ...unitList];
        worksheet.getColumn('X').hidden = true;
        worksheet.getColumn('Y').hidden = true;

        // 🎯 Danh sách vùng dropdown cần gán
        const validations = [
            { range: `A2:A${MAX}`, formula: `=$X$2:$X$${deviceCodeList.length + 1}` },
            { range: `D2:D${MAX}`, formula: `=$Y$2:$Y$${unitList.length + 1}` },
        ];

        const buffer = await configExport(workbook, worksheet, validations, MAX);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=ma_giao_khoan.xlsx');
        res.send(buffer);
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
};


