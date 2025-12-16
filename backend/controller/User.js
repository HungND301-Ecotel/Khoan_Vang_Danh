const User = require('../model/User')

exports.update = async (req, res) => {
    try {
        const userupdate = await User.findByIdAndUpdate(req.params.id, req.body.data, { new: true })

        if (!userupdate) {
            return res.status(400).json({ status: 'error', message: 'Không thể cập nhật người dùng' })
        }

        const { password, ...other } = userupdate._doc

        res.status(200).json({ status: 'success', message: 'Cập nhật người dùng thành công', data: other })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
    }
}