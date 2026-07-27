const Joi = require('joi');

const normItemSchema = Joi.object({
  assignmentCode: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .optional(),
  norm: Joi.number().allow(null).optional(),
});

const createSchema = Joi.object({
  code: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Mã điều chỉnh là bắt buộc',
      'any.required': 'Mã điều chỉnh là bắt buộc',
    }),
  hardness: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .optional(),
  rockRatio: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .optional(),
  mirrorRatio: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .optional(),
  type: Joi.string()
    .valid('CM', 'CKKT', 'CKĐL')
    .required()
    .messages({
      'any.only': 'Loại phải là CM, CKKT hoặc CKĐL',
      'any.required': 'Loại là bắt buộc',
    }),
  norms: Joi.array().items(normItemSchema).optional(),
});

const updateSchema = Joi.object({
  code: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Mã điều chỉnh là bắt buộc',
      'any.required': 'Mã điều chỉnh là bắt buộc',
    }),
  hardness: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .optional(),
  rockRatio: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .optional(),
  mirrorRatio: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .optional(),
  type: Joi.string()
    .valid('CM', 'CKKT', 'CKĐL')
    .required()
    .messages({
      'any.only': 'Loại phải là CM, CKKT hoặc CKĐL',
      'any.required': 'Loại là bắt buộc',
    }),
  norms: Joi.array().items(normItemSchema).optional(),
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
