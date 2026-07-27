const MirrorRatioModel = require('./mirror-ratio.model');
const MirrorRatioService = require('./mirror-ratio.service');
const MirrorRatioController = require('./mirror-ratio.controller');
const mirrorRatioRoutes = require('./mirror-ratio.routes');
const mirrorRatioValidation = require('./mirror-ratio.validation');

module.exports = { MirrorRatioModel, MirrorRatioService, MirrorRatioController, mirrorRatioRoutes, mirrorRatioValidation };
