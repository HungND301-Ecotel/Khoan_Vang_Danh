const jwt = require('jsonwebtoken');
const User = require('../../../model/User');
const AppError = require('../exceptions/AppError');

/**
 * Xác thực JWT token
 */
const verifyToken = async (req, res, next) => {
  try {
    // 1) Kiểm tra token tồn tại
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.', 401));
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Kiểm tra user còn tồn tại
    const currentUser = await User.findById(decoded.userId || decoded.id);
    if (!currentUser) {
      return next(new AppError('User thuộc token này không còn tồn tại.', 401));
    }

    // 4) Kiểm tra password có thay đổi sau khi token được tạo không
    if (currentUser.passwordChangedAt) {
      const changedTimestamp = Math.floor(currentUser.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedTimestamp) {
        return next(new AppError('Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.', 401));
      }
    }

    // Grant access
    req.user = currentUser;
    req.userId = currentUser._id;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Token không hợp lệ. Vui lòng đăng nhập lại!', 401));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token đã hết hạn. Vui lòng đăng nhập lại!', 401));
    }
    next(err);
  }
};

/**
 * Phân quyền theo role
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError('Bạn không có quyền thực hiện hành động này', 403));
    }
    next();
  };
};

module.exports = {
  verifyToken,
  restrictTo,
};
