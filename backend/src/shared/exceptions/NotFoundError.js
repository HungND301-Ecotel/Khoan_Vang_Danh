const AppError = require('./AppError');

class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy dữ liệu') {
    super(message, 404);
  }
}

module.exports = NotFoundError;
