const DepartmentModel = require('./department.model');
const DepartmentService = require('./department.service');
const DepartmentController = require('./department.controller');
const departmentRoutes = require('./department.routes');
const departmentValidation = require('./department.validation');

module.exports = {
  DepartmentModel,
  DepartmentService,
  DepartmentController,
  departmentRoutes,
  departmentValidation,
};
