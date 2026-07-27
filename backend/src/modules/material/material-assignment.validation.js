const Joi = require('joi');

const priceHistoryItemSchema = Joi.object({
  price: Joi.number().allow(null).optional(),
  startMonth: Joi.string()
    .pattern(/^\d{4}-\d{2}$/)
    .allow(null, '')
    .optional()
    .messages({
      'string.pattern.base': 'Tháng phải có định dạng YYYY-MM',
    }),
  endMonth: Joi.string()
    .pattern(/^\d{4}-\d{2}$/)
    .allow(null, '')
    .optional()
    .messages({
      'string.pattern.base': 'Tháng phải có định dạng YYYY-MM',
    }),
});

const objectIdPattern = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .allow(null, '')
  .optional();

const createSchema = Joi.object({
  code: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Mã vật tư là bắt buộc',
      'any.required': 'Mã vật tư là bắt buộc',
    }),
  name: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Tên vật tư là bắt buộc',
      'any.required': 'Tên vật tư là bắt buộc',
    }),
  uom: objectIdPattern.messages({
    'string.pattern.base': 'Đơn vị tính không hợp lệ',
  }),
  assignmentCode: objectIdPattern.messages({
    'string.pattern.base': 'Mã giao khoán không hợp lệ',
  }),
  quantity: Joi.number().allow(null).optional(),
  priceHistory: Joi.array().items(priceHistoryItemSchema).optional(),
});

const updateSchema = Joi.object({
  code: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Mã vật tư là bắt buộc',
      'any.required': 'Mã vật tư là bắt buộc',
    }),
  name: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Tên vật tư là bắt buộc',
      'any.required': 'Tên vật tư là bắt buộc',
    }),
  uom: objectIdPattern.messages({
    'string.pattern.base': 'Đơn vị tính không hợp lệ',
  }),
  assignmentCode: objectIdPattern.messages({
    'string.pattern.base': 'Mã giao khoán không hợp lệ',
  }),
  quantity: Joi.number().allow(null).optional(),
  priceHistory: Joi.array().items(priceHistoryItemSchema).optional(),
});

const idSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID không hợp lệ',
      'any.required': 'ID là bắt buộc',
    }),
});

const deleteManySchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required()
    .messages({
      'array.min': 'Vui lòng chọn ít nhất 1 bản ghi',
      'any.required': 'Danh sách ID là bắt buộc',
    }),
});

module.exports = { createSchema, updateSchema, idSchema, deleteManySchema };
