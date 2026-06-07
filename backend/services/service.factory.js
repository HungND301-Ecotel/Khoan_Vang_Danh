// Models
const Unit = require("../model/Unit");
const DeviceCode = require("../model/DeviceCode");
const AssignmentCode = require("../model/AssignmentCode");
const MaterialAssignment = require("../model/MaterialAssignment");

// Repositories
const UnitRepository = require("../repositories/unit.repository");
const DeviceCodeRepository = require("../repositories/deviceCode.repository");
const AssignmentCodeRepository = require("../repositories/assignmentCode.repository");
const MaterialAssignmentRepository = require("../repositories/materialAssignment.repository");

// Services
const UnitService = require("../services/unit.service");
const DeviceCodeService = require("../services/deviceCode.service");
const AssignmentCodeService = require("../services/assignmentCode.service");
const MaterialAssignmentService = require("../services/materialAssignment.service");

// Khởi tạo repositories
const unitRepository = new UnitRepository(Unit);
const deviceCodeRepository = new DeviceCodeRepository(DeviceCode);
const assignmentCodeRepository = new AssignmentCodeRepository(AssignmentCode);
const materialAssignmentRepository = new MaterialAssignmentRepository(MaterialAssignment);

// Khởi tạo services
const services = {
  unit: new UnitService(unitRepository),
  deviceCode: new DeviceCodeService(deviceCodeRepository),
  assignmentCode: new AssignmentCodeService({
    assignmentCodeRepository: assignmentCodeRepository,
    deviceCodeRepository: deviceCodeRepository,
    unitRepository: unitRepository,
  }),
  materialAssignment: new MaterialAssignmentService({
    materialAssignmentRepository: materialAssignmentRepository,
    assignmentCodeRepository: assignmentCodeRepository,
    unitRepository: unitRepository,
  }),
};

const getService = (name) => {
  if (!services[name]) {
    throw new Error(`Service '${name}' not found`);
  }
  return services[name];
};

module.exports = { getService };
