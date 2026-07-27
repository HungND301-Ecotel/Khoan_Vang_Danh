const Joi = require('joi');

const createSchema = Joi.object({
  code: Joi.string().trim().required().messages({
    'string.empty': 'Mã công đoạn là bắt buộc',
    'any.required': 'Mã công đoạn là bắt buộc',
  }),
  name: Joi.string().trim().required().messages({
    'string.empty': 'Tên công đoạn là bắt buộc',
    'any.required': 'Tên công đoạn là bắt buộc',
  }),
  phaseGroup: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Nhóm công đoạn không hợp lệ',
    'any.required': 'Nhóm công đoạn là bắt buộc',
  }),
});

const updateSchema = Joi.object({
  code: Joi.string().trim().required().messages({
    'string.empty': 'Mã công đoạn là bắt buộc',
    'any.required': 'Mã công đoạn là bắt buộc',
  }),
  name: Joi.string().trim().required().messages({
    'string.empty': 'Tên công đoạn là bắt buộc',
    'any.required': 'Tên công đoạn là bắt buộc',
  }),
  phaseGroup: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Nhóm công đoạn không hợp lệ',
    'any.required': 'Nhóm công đoạn là bắt buộc',
  }),
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

module.exports = {
  createSchema,
  updateSchema,
  idSchema,
  deleteManySchema,
};
