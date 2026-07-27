const ProductionScopeModel = require('./productionScope.model');
const ProductionScopeService = require('./productionScope.service');
const ProductionScopeController = require('./productionScope.controller');
const productionScopeRoutes = require('./productionScope.routes');
const productionScopeValidation = require('./productionScope.validation');

module.exports = {
  ProductionScopeModel,
  ProductionScopeService,
  ProductionScopeController,
  productionScopeRoutes,
  productionScopeValidation,
};
