const Phase = require('../model/Phase')
const PhaseGroup = require('../model/PhaseGroup')
const ExcelJS = require('exceljs')
const { configExport } = require('../utils/config_export')
const { paginateQuery } = require('../utils/pagination')

exports.create = async (req, res) => {
    try {
        const { code, name, phaseGroup } = req.body
        const newPhase = new Phase({ code, name, phaseGroup })
        await newPhase.save()
        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const updateData = await Phase.findByIdAndUpdate(req.params.id, req.body, { new: true })
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
        const deleteData = await Phase.findByIdAndDelete(req.params.id)
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
        if (req.query.phaseGroup) {
            query.phaseGroup = req.query.phaseGroup
        }
        if (req.query.q) {
            query.$or = [
                { code: new RegExp(req.query.q, 'i') },
                { name: new RegExp(req.query.q, 'i') }
            ]
        }
        const modelQuery = Phase.find(query).populate('phaseGroup')
        const pagination = await paginateQuery(Phase, modelQuery, query, req.query)

        res.status(200).json({ status: 'success', data: pagination })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.export = async (req, res) => {
    try {
        const data = await Phase.find()
            .populate("phaseGroup", "name")

        const columns = [
            { header: "Mã", key: "_id", width: 20 },
            { header: "Mã công đoạn", key: "code", width: 20 },
            { header: "Tên công đoạn", key: "name", width: 30 },
            { header: "Nhóm công đoạn", key: "group", width: 20 },
        ];

        const formated = (data || []).map(i => ({
            _id: i._id,
            code: i?.code || '',
            name: i?.name || '',
            group: i?.phaseGroup?.name || '',
        }));

        const groups = await PhaseGroup.find();

        const groupList = [...new Set(groups.map(p => p.name).filter(Boolean))];

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('cong_doan_san_xuat');

        // 🧩 1️⃣ Thêm dữ liệu chính TRƯỚC
        worksheet.columns = columns;
        worksheet.addRows(formated);

        const MAX = Math.max(worksheet.rowCount + 100, 1000);

        // 🧩 2️⃣ Sau đó mới thêm các danh sách dropdown
        worksheet.getColumn('X').values = ['groups', ...groupList];
        worksheet.getColumn('X').hidden = true;

        // 🎯 Danh sách vùng dropdown cần gán
        const validations = [
            { range: `D2:D${MAX}`, formula: `=$X$2:$X$${groupList.length + 1}` },
        ];

        const buffer = await configExport(workbook, worksheet, validations, MAX);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=ma_giao_khoan.xlsx');
        res.send(buffer);
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
}


