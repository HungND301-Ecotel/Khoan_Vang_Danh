const MaterialBudgetModel = require('./material-budget.model');
const MaterialBudgetService = require('./material-budget.service');
const MaterialBudgetController = require('./material-budget.controller');
const materialBudgetRoutes = require('./material-budget.routes');
const materialBudgetValidation = require('./material-budget.validation');

module.exports = {
  MaterialBudgetModel,
  MaterialBudgetService,
  MaterialBudgetController,
  materialBudgetRoutes,
  materialBudgetValidation,
};
