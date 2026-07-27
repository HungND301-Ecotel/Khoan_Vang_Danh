const AppError = require('../exceptions/AppError');

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // Production - không leak chi tiết lỗi
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Programming error - log nhưng không trả chi tiết
  console.error('ERROR 💥', err);
  res.status(500).json({
    status: 'error',
    message: 'Đã xảy ra lỗi hệ thống',
  });
};

module.exports = errorMiddleware;
