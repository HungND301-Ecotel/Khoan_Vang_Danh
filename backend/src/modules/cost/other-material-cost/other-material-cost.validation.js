const Joi = require('joi');

const objectIdPattern = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .allow(null, '')
  .optional();

const materialItemSchema = Joi.object({
  material: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID vật tư không hợp lệ',
      'any.required': 'Vật tư là bắt buộc',
    }),
  quantity: Joi.number().required().messages({
    'number.base': 'Số lượng phải là số',
    'any.required': 'Số lượng là bắt buộc',
  }),
});

const createSchema = Joi.object({
  department: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID phân xưởng không hợp lệ',
      'any.required': 'Phân xưởng là bắt buộc',
    }),
  month: Joi.string()
    .pattern(/^\d{4}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Tháng phải có định dạng YYYY-MM',
      'any.required': 'Tháng là bắt buộc',
    }),
  materials: Joi.array().items(materialItemSchema).min(1).required().messages({
    'array.min': 'Vui lòng chọn ít nhất 1 vật tư',
    'any.required': 'Danh sách vật tư là bắt buộc',
  }),
});

const updateSchema = Joi.object({
  department: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID phân xưởng không hợp lệ',
      'any.required': 'Phân xưởng là bắt buộc',
    }),
  month: Joi.string()
    .pattern(/^\d{4}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Tháng phải có định dạng YYYY-MM',
      'any.required': 'Tháng là bắt buộc',
    }),
  materials: Joi.array().items(materialItemSchema).min(1).required().messages({
    'array.min': 'Vui lòng chọn ít nhất 1 vật tư',
    'any.required': 'Danh sách vật tư là bắt buộc',
  }),
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

module.exports = { createSchema, updateSchema, idSchema };
