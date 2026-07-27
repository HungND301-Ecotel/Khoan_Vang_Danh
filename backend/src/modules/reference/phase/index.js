const PhaseModel = require('./phase.model');
const PhaseService = require('./phase.service');
const PhaseController = require('./phase.controller');
const phaseRoutes = require('./phase.routes');
const phaseValidation = require('./phase.validation');

module.exports = {
  PhaseModel,
  PhaseService,
  PhaseController,
  phaseRoutes,
  phaseValidation,
};
