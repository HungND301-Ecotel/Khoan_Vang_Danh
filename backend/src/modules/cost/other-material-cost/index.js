const OtherMaterialCostModel = require('./other-material-cost.model');
const OtherMaterialCostService = require('./other-material-cost.service');
const OtherMaterialCostController = require('./other-material-cost.controller');
const otherMaterialCostRoutes = require('./other-material-cost.routes');
const otherMaterialCostValidation = require('./other-material-cost.validation');

module.exports = {
  OtherMaterialCostModel,
  OtherMaterialCostService,
  OtherMaterialCostController,
  otherMaterialCostRoutes,
  otherMaterialCostValidation,
};
