const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/User');


exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({
                status: 'error',
                message: 'Tên đăng nhập đã tồn tại'
            });
        }

        // Create new user
        user = new User({
            username,
            password,
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save user
        await user.save();

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                }
            }
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;


        // Check if user exists
        const user = await User.findOne({ username })
        if (!user) {
            return res.status(404).json({
                status: 'error', message: 'Không tìm thấy người dùng'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                status: 'error', message: 'Mật khẩu không đúng'
            });
        }

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({
            success: true,
            data: {
                token,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                }
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message, stack: error.stack })

    }
}

exports.changePass = async (req, res) => {
    try {
        const { oldPass, newPass } = req.body.data
        const user = await User.findById(req.params.id)
        if (!user) {
            res.status(404).json({ status: 'error', message: "Không tìm thấy người dùng." })
        }  

        const checkPass = await bcrypt.compare(oldPass, user.password)

        if (!checkPass) {
            res.status(400).json({ status: 'error', message: "Mật khẩu cũ không chính xác" })
        }
        const genSalt = await bcrypt.genSalt(10)
        const hashPass = await bcrypt.hash(newPass, genSalt)

        user.password = hashPass
        await user.save()

        res.status(200).json({ status: 'success', message: 'Đổi mật khẩu thành công' })

    } catch (error) {
        console.log(error.stack)
        res.status(500).json({ status: 'error', message: error.message, stack: error.stack })
    }
}
