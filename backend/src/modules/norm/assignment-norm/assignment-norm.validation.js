const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const normItemSchema = Joi.object({
  assignmentCode: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'Mã giao khoán không hợp lệ',
    'any.required': 'Mã giao khoán là bắt buộc',
  }),
  norm: Joi.number().required().messages({
    'number.base': 'Định mức phải là số',
    'any.required': 'Định mức là bắt buộc',
  }),
});

const createSchema = Joi.object({
  code: Joi.string().trim().required().messages({
    'string.empty': 'Mã định mức giao khoán là bắt buộc',
    'any.required': 'Mã định mức giao khoán là bắt buộc',
  }),
  phaseGroup: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  phase: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  excavationTech: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  step: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  length: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  crossSection: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  curbSlope: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  hardness: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  thickness: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  type: Joi.string()
    .valid('cutting', 'excavation', 'coal_kb', 'coal_zh', 'coal_zry')
    .allow(null, '')
    .optional()
    .messages({
      'any.only': 'Loại không hợp lệ',
    }),
  norms: Joi.array().items(normItemSchema).optional(),
});

const updateSchema = Joi.object({
  code: Joi.string().trim().required().messages({
    'string.empty': 'Mã định mức giao khoán là bắt buộc',
    'any.required': 'Mã định mức giao khoán là bắt buộc',
  }),
  phaseGroup: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  phase: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  excavationTech: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  step: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  length: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  crossSection: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  curbSlope: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  hardness: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  thickness: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  type: Joi.string()
    .valid('cutting', 'excavation', 'coal_kb', 'coal_zh', 'coal_zry')
    .allow(null, '')
    .optional()
    .messages({
      'any.only': 'Loại không hợp lệ',
    }),
  norms: Joi.array().items(normItemSchema).optional(),
});

const idSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'ID không hợp lệ',
    'any.required': 'ID là bắt buộc',
  }),
});

const deleteManySchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().pattern(objectIdPattern))
    .min(1)
    .required()
    .messages({
      'array.min': 'Vui lòng chọn ít nhất 1 bản ghi',
      'any.required': 'Danh sách ID là bắt buộc',
    }),
});

module.exports = { createSchema, updateSchema, idSchema, deleteManySchema };
