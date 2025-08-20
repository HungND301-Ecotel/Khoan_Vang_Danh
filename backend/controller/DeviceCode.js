const DeviceCode = require('../model/DeviceCode')


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