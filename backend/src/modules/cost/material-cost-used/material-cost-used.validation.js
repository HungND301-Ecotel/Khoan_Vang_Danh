const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const materialItemSchema = Joi.object({
  material: objectId.required().messages({
    'string.pattern.base': 'ID vật tư không hợp lệ',
    'any.required': 'Vật tư là bắt buộc',
  }),
  assignmentCode: objectId.allow(null, '').optional(),
  quantity: Joi.number().allow(null).optional(),
  price: Joi.number().allow(null).optional(),
  cost: Joi.number().allow(null).optional(),
});

const createSchema = Joi.object({
  productionScope: objectId.required().messages({
    'string.pattern.base': 'ID diện sản xuất không hợp lệ',
    'any.required': 'Diện sản xuất là bắt buộc',
  }),
  department: objectId.required().messages({
    'string.pattern.base': 'ID phân xưởng không hợp lệ',
    'any.required': 'Phân xưởng là bắt buộc',
  }),
  month: Joi.string().allow(null, '').optional(),
  phase: objectId.required().messages({
    'string.pattern.base': 'ID khâu không hợp lệ',
    'any.required': 'Khâu là bắt buộc',
  }),
  production: Joi.number().allow(null).optional(),
  unit: Joi.string().allow(null, '').optional(),
  materials: Joi.array().items(materialItemSchema).optional(),
});

const batchSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        _id: objectId.optional(),
        productionScope: objectId.required().messages({
          'any.required': 'Diện sản xuất là bắt buộc',
        }),
        department: objectId.required().messages({
          'any.required': 'Phân xưởng là bắt buộc',
        }),
        month: Joi.string().allow(null, '').optional(),
        phase: objectId.required().messages({
          'any.required': 'Khâu là bắt buộc',
        }),
        production: Joi.number().allow(null).optional(),
        unit: Joi.string().allow(null, '').optional(),
        materials: Joi.array().items(materialItemSchema).optional(),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'Thiếu dữ liệu items',
      'any.required': 'Thiếu dữ liệu items',
    }),
});

const updateSchema = Joi.object({
  productionScope: objectId.optional(),
  department: objectId.optional(),
  month: Joi.string().allow(null, '').optional(),
  phase: objectId.optional(),
  production: Joi.number().allow(null).optional(),
  unit: Joi.string().allow(null, '').optional(),
  materials: Joi.array().items(materialItemSchema).optional(),
});

const idSchema = Joi.object({
  id: objectId.required().messages({
    'string.pattern.base': 'ID không hợp lệ',
    'any.required': 'ID là bắt buộc',
  }),
});

const deleteByDepartmentSchema = Joi.object({
  departmentIds: Joi.array()
    .items(objectId)
    .min(1)
    .required()
    .messages({
      'array.min': 'Chọn phân xưởng cần xóa',
      'any.required': 'Chọn phân xưởng cần xóa',
    }),
});

module.exports = {
  createSchema,
  batchSchema,
  updateSchema,
  idSchema,
  deleteByDepartmentSchema,
};
