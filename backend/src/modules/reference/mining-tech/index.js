const MiningTechModel = require('./miningTech.model');
const MiningTechService = require('./miningTech.service');
const MiningTechController = require('./miningTech.controller');
const miningTechRoutes = require('./miningTech.routes');
const miningTechValidation = require('./miningTech.validation');

module.exports = {
  MiningTechModel,
  MiningTechService,
  MiningTechController,
  miningTechRoutes,
  miningTechValidation,
};
