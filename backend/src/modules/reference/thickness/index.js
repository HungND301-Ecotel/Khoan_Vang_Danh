const ThicknessModel = require('./thickness.model');
const ThicknessService = require('./thickness.service');
const ThicknessController = require('./thickness.controller');
const thicknessRoutes = require('./thickness.routes');
const thicknessValidation = require('./thickness.validation');

module.exports = { ThicknessModel, ThicknessService, ThicknessController, thicknessRoutes, thicknessValidation };
