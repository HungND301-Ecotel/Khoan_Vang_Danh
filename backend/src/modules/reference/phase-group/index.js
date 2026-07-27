const PhaseGroupModel = require('./phaseGroup.model');
const PhaseGroupService = require('./phaseGroup.service');
const PhaseGroupController = require('./phaseGroup.controller');
const phaseGroupRoutes = require('./phaseGroup.routes');
const phaseGroupValidation = require('./phaseGroup.validation');

module.exports = {
  PhaseGroupModel,
  PhaseGroupService,
  PhaseGroupController,
  phaseGroupRoutes,
  phaseGroupValidation,
};
