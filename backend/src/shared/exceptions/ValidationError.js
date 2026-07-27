const AppError = require('./AppError');

class ValidationError extends AppError {
  constructor(message = 'Dữ liệu không hợp lệ') {
    super(message, 400);
  }
}

module.exports = ValidationError;
