const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Tên tiết diện là bắt buộc',
    'any.required': 'Tên tiết diện là bắt buộc',
  }),
  uom: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null, '').optional(),
});

const updateSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Tên tiết diện là bắt buộc',
    'any.required': 'Tên tiết diện là bắt buộc',
  }),
  uom: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null, '').optional(),
});

const idSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
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
