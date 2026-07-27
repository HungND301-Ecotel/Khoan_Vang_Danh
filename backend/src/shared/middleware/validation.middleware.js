const ValidationError = require('../exceptions/ValidationError');

/**
 * Tạo middleware validate request body
 * @param {Function} validateFn - Hàm validate, trả về { error, value }
 */
const validateBody = (validateFn) => {
  return (req, res, next) => {
    const { error, value } = validateFn(req.body);
    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return next(new ValidationError(message));
    }
    req.body = value;
    next();
  };
};

/**
 * Tạo middleware validate request params
 */
const validateParams = (validateFn) => {
  return (req, res, next) => {
    const { error, value } = validateFn(req.params);
    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return next(new ValidationError(message));
    }
    req.params = value;
    next();
  };
};

/**
 * Tạo middleware validate request query
 */
const validateQuery = (validateFn) => {
  return (req, res, next) => {
    const { error, value } = validateFn(req.query);
    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return next(new ValidationError(message));
    }
    req.query = value;
    next();
  };
};

module.exports = {
  validateBody,
  validateParams,
  validateQuery,
};
