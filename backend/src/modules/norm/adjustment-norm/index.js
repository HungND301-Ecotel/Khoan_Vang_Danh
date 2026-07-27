const AdjustmentNormModel = require('./adjustment-norm.model');
const AdjustmentNormService = require('./adjustment-norm.service');
const AdjustmentNormController = require('./adjustment-norm.controller');
const adjustmentNormRoutes = require('./adjustment-norm.routes');
const adjustmentNormValidation = require('./adjustment-norm.validation');

module.exports = {
  AdjustmentNormModel,
  AdjustmentNormService,
  AdjustmentNormController,
  adjustmentNormRoutes,
  adjustmentNormValidation,
};
