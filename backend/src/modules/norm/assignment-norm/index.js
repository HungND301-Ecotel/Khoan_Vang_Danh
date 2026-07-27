const AssignmentNormModel = require('./assignment-norm.model');
const AssignmentNormService = require('./assignment-norm.service');
const AssignmentNormController = require('./assignment-norm.controller');
const assignmentNormRoutes = require('./assignment-norm.routes');
const assignmentNormValidation = require('./assignment-norm.validation');

module.exports = {
  AssignmentNormModel,
  AssignmentNormService,
  AssignmentNormController,
  assignmentNormRoutes,
  assignmentNormValidation,
};
