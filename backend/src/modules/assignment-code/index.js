const AssignmentCodeModel = require('./assignment-code.model');
const AssignmentCodeService = require('./assignment-code.service');
const AssignmentCodeController = require('./assignment-code.controller');
const assignmentCodeRoutes = require('./assignment-code.routes');
const assignmentCodeValidation = require('./assignment-code.validation');

module.exports = { AssignmentCodeModel, AssignmentCodeService, AssignmentCodeController, assignmentCodeRoutes, assignmentCodeValidation };
