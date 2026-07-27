const HardnessModel = require('./hardness.model');
const HardnessService = require('./hardness.service');
const HardnessController = require('./hardness.controller');
const hardnessRoutes = require('./hardness.routes');
const hardnessValidation = require('./hardness.validation');

module.exports = { HardnessModel, HardnessService, HardnessController, hardnessRoutes, hardnessValidation };
