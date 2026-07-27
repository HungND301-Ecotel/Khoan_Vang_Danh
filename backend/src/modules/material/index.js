const MaterialAssignmentModel = require('./material-assignment.model');
const MaterialAssignmentService = require('./material-assignment.service');
const MaterialAssignmentController = require('./material-assignment.controller');
const materialAssignmentRoutes = require('./material-assignment.routes');
const materialAssignmentValidation = require('./material-assignment.validation');

module.exports = {
  MaterialAssignmentModel,
  MaterialAssignmentService,
  MaterialAssignmentController,
  materialAssignmentRoutes,
  materialAssignmentValidation,
};
