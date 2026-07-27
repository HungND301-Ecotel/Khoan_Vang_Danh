const DeviceCodeModel = require('./deviceCode.model');
const DeviceCodeService = require('./deviceCode.service');
const DeviceCodeController = require('./deviceCode.controller');
const deviceCodeRoutes = require('./deviceCode.routes');
const deviceCodeValidation = require('./deviceCode.validation');

module.exports = {
  DeviceCodeModel,
  DeviceCodeService,
  DeviceCodeController,
  deviceCodeRoutes,
  deviceCodeValidation,
};
