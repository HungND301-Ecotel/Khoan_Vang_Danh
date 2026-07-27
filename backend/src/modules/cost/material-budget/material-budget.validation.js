const Joi = require('joi');

/**
 * Validate query cho GET / (Cấp 0 - departments aggregation)
 */
const getQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  department: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  q: Joi.string().trim(),
});

/**
 * Validate query cho GET /months (Cấp 1)
 */
const getMonthsQuerySchema = Joi.object({
  department: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'ID phòng ban không hợp lệ',
    'any.required': 'Thiếu department',
  }),
  productionScope: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
});

/**
 * Validate query cho GET /scopes (Cấp 2)
 */
const getScopesQuerySchema = Joi.object({
  department: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'ID phòng ban không hợp lệ',
    'any.required': 'Thiếu department',
  }),
  month: Joi.string().trim().required().messages({
    'string.empty': 'Thiếu month',
    'any.required': 'Thiếu month',
  }),
});

/**
 * Validate query cho GET /phases (Cấp 3)
 */
const getPhasesQuerySchema = Joi.object({
  department: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'ID phòng ban không hợp lệ',
    'any.required': 'Thiếu department',
  }),
  month: Joi.string().trim().required().messages({
    'string.empty': 'Thiếu month',
    'any.required': 'Thiếu month',
  }),
  productionScope: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'ID diện sản xuất không hợp lệ',
    'any.required': 'Thiếu productionScope',
  }),
});

/**
 * Validate params cho GET /:id
 */
const idSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'ID không hợp lệ',
    'any.required': 'ID là bắt buộc',
  }),
});

module.exports = {
  getQuerySchema,
  getMonthsQuerySchema,
  getScopesQuerySchema,
  getPhasesQuerySchema,
  idSchema,
};
