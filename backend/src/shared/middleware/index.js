const { verifyToken, restrictTo } = require('./auth.middleware');
const errorMiddleware = require('./error.middleware');
const { validateBody, validateParams, validateQuery } = require('./validation.middleware');

module.exports = {
  verifyToken,
  restrictTo,
  errorMiddleware,
  validateBody,
  validateParams,
  validateQuery,
};
