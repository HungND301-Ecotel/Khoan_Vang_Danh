const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const detailItemSchema = Joi.object({
  assignmentCode: Joi.string()
    .pattern(objectIdPattern)
    .allow(null, '')
    .optional()
    .messages({
      'string.pattern.base': 'Mã giao khoán không hợp lệ',
    }),
  baseNorm: Joi.number().allow(null).optional(),
  adjustmentNorm: Joi.number().allow(null).optional(),
  norm: Joi.number().allow(null).optional(),
  quantity: Joi.number().allow(null).optional(),
  price: Joi.number().allow(null).optional(),
  cost: Joi.number().allow(null).optional(),
});

const createSchema = Joi.object({
  productionScope: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Phạm vi sản xuất không hợp lệ',
      'any.required': 'Phạm vi sản xuất là bắt buộc',
    }),
  department: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Phân xưởng không hợp lệ',
      'any.required': 'Phân xưởng là bắt buộc',
    }),
  month: Joi.string()
    .pattern(/^\d{4}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Tháng phải có định dạng YYYY-MM',
      'any.required': 'Tháng là bắt buộc',
    }),
  phase: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Công đoạn không hợp lệ',
      'any.required': 'Công đoạn là bắt buộc',
    }),
  production: Joi.number().allow(null).optional(),
  unit: Joi.string().allow(null, '').optional(),
  assignmentNormCode: Joi.string()
    .pattern(objectIdPattern)
    .allow(null, '')
    .optional()
    .messages({
      'string.pattern.base': 'Mã định mức giao khoán không hợp lệ',
    }),
  adjustmentNormCode: Joi.string()
    .pattern(objectIdPattern)
    .allow(null, '')
    .optional()
    .messages({
      'string.pattern.base': 'Mã điều chỉnh không hợp lệ',
    }),
  assignmentCodes: Joi.array()
    .items(
      Joi.object({
        assignmentCode: Joi.alternatives()
          .try(
            Joi.string().pattern(objectIdPattern),
            Joi.object({ _id: Joi.string().pattern(objectIdPattern) })
          )
          .required()
          .messages({
            'any.required': 'Mã giao khoán là bắt buộc',
          }),
        baseNorm: Joi.number().allow(null).optional(),
        adjustmentNorm: Joi.number().allow(null).optional(),
        norm: Joi.number().allow(null).optional(),
      })
    )
    .optional(),
  initialPlannedCostDetails: Joi.array().items(detailItemSchema).optional(),
  totalInitialPlannedCost: Joi.number().allow(null).optional(),
});

const updateSchema = Joi.object({
  productionScope: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Phạm vi sản xuất không hợp lệ',
      'any.required': 'Phạm vi sản xuất là bắt buộc',
    }),
  department: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Phân xưởng không hợp lệ',
      'any.required': 'Phân xưởng là bắt buộc',
    }),
  month: Joi.string()
    .pattern(/^\d{4}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Tháng phải có định dạng YYYY-MM',
      'any.required': 'Tháng là bắt buộc',
    }),
  phase: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Công đoạn không hợp lệ',
      'any.required': 'Công đoạn là bắt buộc',
    }),
  production: Joi.number().allow(null).optional(),
  unit: Joi.string().allow(null, '').optional(),
  assignmentNormCode: Joi.string()
    .pattern(objectIdPattern)
    .allow(null, '')
    .optional()
    .messages({
      'string.pattern.base': 'Mã định mức giao khoán không hợp lệ',
    }),
  adjustmentNormCode: Joi.string()
    .pattern(objectIdPattern)
    .allow(null, '')
    .optional()
    .messages({
      'string.pattern.base': 'Mã điều chỉnh không hợp lệ',
    }),
  assignmentCodes: Joi.array()
    .items(
      Joi.object({
        assignmentCode: Joi.alternatives()
          .try(
            Joi.string().pattern(objectIdPattern),
            Joi.object({ _id: Joi.string().pattern(objectIdPattern) })
          )
          .required()
          .messages({
            'any.required': 'Mã giao khoán là bắt buộc',
          }),
        baseNorm: Joi.number().allow(null).optional(),
        adjustmentNorm: Joi.number().allow(null).optional(),
        norm: Joi.number().allow(null).optional(),
      })
    )
    .optional(),
  initialPlannedCostDetails: Joi.array().items(detailItemSchema).optional(),
  totalInitialPlannedCost: Joi.number().allow(null).optional(),
});

const idSchema = Joi.object({
  id: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'ID không hợp lệ',
      'any.required': 'ID là bắt buộc',
    }),
});

const batchSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string()
          .pattern(objectIdPattern)
          .optional(),
        productionScope: Joi.string()
          .pattern(objectIdPattern)
          .required()
          .messages({
            'string.pattern.base': 'Phạm vi sản xuất không hợp lệ',
            'any.required': 'Phạm vi sản xuất là bắt buộc',
          }),
        department: Joi.string()
          .pattern(objectIdPattern)
          .required()
          .messages({
            'string.pattern.base': 'Phân xưởng không hợp lệ',
            'any.required': 'Phân xưởng là bắt buộc',
          }),
        month: Joi.string()
          .pattern(/^\d{4}-\d{2}$/)
          .required()
          .messages({
            'string.pattern.base': 'Tháng phải có định dạng YYYY-MM',
            'any.required': 'Tháng là bắt buộc',
          }),
        phase: Joi.string()
          .pattern(objectIdPattern)
          .required()
          .messages({
            'string.pattern.base': 'Công đoạn không hợp lệ',
            'any.required': 'Công đoạn là bắt buộc',
          }),
        production: Joi.number().allow(null).optional(),
        unit: Joi.string().allow(null, '').optional(),
        assignmentNormCode: Joi.string()
          .pattern(objectIdPattern)
          .allow(null, '')
          .optional(),
        adjustmentNormCode: Joi.string()
          .pattern(objectIdPattern)
          .allow(null, '')
          .optional(),
        assignmentCodes: Joi.array().optional(),
        initialPlannedCostDetails: Joi.array().optional(),
        totalInitialPlannedCost: Joi.number().allow(null).optional(),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'Vui lòng cung cấp ít nhất 1 bản ghi',
      'any.required': 'Danh sách items là bắt buộc',
    }),
});

const deleteBatchSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().pattern(objectIdPattern))
    .min(1)
    .required()
    .messages({
      'array.min': 'Vui lòng chọn ít nhất 1 bản ghi',
      'any.required': 'Danh sách ID là bắt buộc',
    }),
});

const deleteByDepartmentSchema = Joi.object({
  departmentIds: Joi.array()
    .items(Joi.string().pattern(objectIdPattern))
    .min(1)
    .required()
    .messages({
      'array.min': 'Vui lòng chọn ít nhất 1 phân xưởng',
      'any.required': 'Danh sách phân xưởng là bắt buộc',
    }),
});

const productionScopeParamSchema = Joi.object({
  productionScope: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Phạm vi sản xuất không hợp lệ',
      'any.required': 'Phạm vi sản xuất là bắt buộc',
    }),
});

const departmentIdParamSchema = Joi.object({
  departmentId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'ID phân xưởng không hợp lệ',
      'any.required': 'ID phân xưởng là bắt buộc',
    }),
});

module.exports = {
  createSchema,
  updateSchema,
  idSchema,
  batchSchema,
  deleteBatchSchema,
  deleteByDepartmentSchema,
  productionScopeParamSchema,
  departmentIdParamSchema,
};
