const MaterialCostUsedModel = require('./material-cost-used.model');
const MaterialCostUsedService = require('./material-cost-used.service');
const MaterialCostUsedController = require('./material-cost-used.controller');
const materialCostUsedRoutes = require('./material-cost-used.routes');
const materialCostUsedValidation = require('./material-cost-used.validation');

module.exports = {
  MaterialCostUsedModel,
  MaterialCostUsedService,
  MaterialCostUsedController,
  materialCostUsedRoutes,
  materialCostUsedValidation,
};
