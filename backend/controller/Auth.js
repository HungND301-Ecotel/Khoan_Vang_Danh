const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/User');

const getJwtSecret = () => process.env.JWT_SECRET || 'secret';
const getJwtRefreshSecret = () => process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET ? `${process.env.JWT_SECRET}_refresh` : 'refresh_secret');

const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        getJwtSecret(),
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    const refreshToken = jwt.sign(
        { userId },
        getJwtRefreshSecret(),
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

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

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);
        user.refreshToken = refreshToken;

        // Save user
        await user.save();

        res.status(201).json({
            success: true,
            data: {
                token: accessToken,
                refreshToken,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
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
        const user = await User.findOne({ username });
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

        // Create tokens
        const { accessToken, refreshToken } = generateTokens(user._id);
        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            success: true,
            data: {
                token: accessToken,
                refreshToken,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                }
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message, stack: error.stack });
    }
}

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                status: 'error',
                message: 'Vui lòng cung cấp refresh token'
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, getJwtRefreshSecret());
        } catch (jwtErr) {
            return res.status(401).json({
                status: 'error',
                message: 'Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
            });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Người dùng không tồn tại'
            });
        }

        // Verify if the token matches stored token (if stored)
        if (user.refreshToken && user.refreshToken !== refreshToken) {
            return res.status(403).json({
                status: 'error',
                message: 'Refresh token đã bị thu hồi hoặc không hợp lệ. Vui lòng đăng nhập lại.'
            });
        }

        // Check if password changed after token was issued
        if (user.passwordChangedAt) {
            const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
            if (decoded.iat < changedTimestamp) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.'
                });
            }
        }

        // Generate new token pair (rotating refresh token)
        const tokens = generateTokens(user._id);
        user.refreshToken = tokens.refreshToken;
        await user.save();

        res.json({
            success: true,
            data: {
                token: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                }
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message, stack: error.stack });
    }
}

exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await User.findOneAndUpdate({ refreshToken }, { $unset: { refreshToken: 1 } });
        }
        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message, stack: error.stack });
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
        user.refreshToken = null; // Invalidate refresh token upon password change
        await user.save()

        res.status(200).json({ status: 'success', message: 'Đổi mật khẩu thành công' })

    } catch (error) {
        console.log(error.stack)
        res.status(500).json({ status: 'error', message: error.message, stack: error.stack })
    }
}
