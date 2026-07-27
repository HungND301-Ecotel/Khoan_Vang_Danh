const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorMiddleware } = require('./shared/middleware');

// Import routes - Reference modules
const { departmentRoutes } = require('./modules/reference/department');
const { unitRoutes } = require('./modules/reference/unit');
const { phaseGroupRoutes } = require('./modules/reference/phase-group');
const { phaseRoutes } = require('./modules/reference/phase');
const { productionScopeRoutes } = require('./modules/reference/production-scope');
const { deviceCodeRoutes } = require('./modules/reference/device-code');
const { excavationTechRoutes } = require('./modules/reference/excavation-tech');
const { hardnessRoutes } = require('./modules/reference/hardness');
const { crossSectionRoutes } = require('./modules/reference/cross-section');
const { curbSlopeRoutes } = require('./modules/reference/curb-slope');
const { thicknessRoutes } = require('./modules/reference/thickness');
const { lengthRoutes } = require('./modules/reference/length');
const { miningTechRoutes } = require('./modules/reference/mining-tech');
const { stepRoutes } = require('./modules/reference/step');
const { rockRatioRoutes } = require('./modules/reference/rock-ratio');
const { mirrorRatioRoutes } = require('./modules/reference/mirror-ratio');

// Import routes - Core modules (Phase 3)
const { assignmentCodeRoutes } = require('./modules/assignment-code');
const { materialAssignmentRoutes } = require('./modules/material');
const { assignmentNormRoutes } = require('./modules/norm/assignment-norm');
const { adjustmentNormRoutes } = require('./modules/norm/adjustment-norm');

// Import routes - Cost modules (Phase 4)
const { initialPlannedCostRoutes } = require('./modules/cost/initial-planned');
const { materialBudgetRoutes } = require('./modules/cost/material-budget');
const { materialCostUsedRoutes } = require('./modules/cost/material-cost-used');
const { otherMaterialCostRoutes } = require('./modules/cost/other-material-cost');

// Import routes - Settlement module (Phase 5)
const { settlementRoutes } = require('./modules/settlement');

// Import routes - Legacy modules (not yet refactored)
const AuthRouter = require('../routes/Auth');
const UserRouter = require('../routes/User');
const SystemConfigRouter = require('../routes/SystemConfig');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Routes - Reference modules (16)
app.use('/api/departments', departmentRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/phasegroups', phaseGroupRoutes);
app.use('/api/phases', phaseRoutes);
app.use('/api/productionscopes', productionScopeRoutes);
app.use('/api/devicecodes', deviceCodeRoutes);
app.use('/api/excavationtechs', excavationTechRoutes);
app.use('/api/hardness', hardnessRoutes);
app.use('/api/crosssections', crossSectionRoutes);
app.use('/api/curbslopes', curbSlopeRoutes);
app.use('/api/thickness', thicknessRoutes);
app.use('/api/length', lengthRoutes);
app.use('/api/miningtechs', miningTechRoutes);
app.use('/api/steps', stepRoutes);
app.use('/api/rockratios', rockRatioRoutes);
app.use('/api/mirrorratios', mirrorRatioRoutes);

// Routes - Core modules (4)
app.use('/api/assignmentcodes', assignmentCodeRoutes);
app.use('/api/materialassignments', materialAssignmentRoutes);
app.use('/api/assignmentnorms', assignmentNormRoutes);
app.use('/api/adjustmentnorms', adjustmentNormRoutes);

// Routes - Cost modules (4)
app.use('/api/initialplannedcosts', initialPlannedCostRoutes);
app.use('/api/materialbudgets', materialBudgetRoutes);
app.use('/api/materialcostuseds', materialCostUsedRoutes);
app.use('/api/othermaterialcosts', otherMaterialCostRoutes);

// Routes - Settlement module (1)
app.use('/api/contractsettlements', settlementRoutes);

// Routes - Legacy modules (not yet refactored)
app.use('/api/auths', AuthRouter);
app.use('/api/users', UserRouter);
app.use('/api/system-configs', SystemConfigRouter);

// Error handling middleware (phải đặt sau routes)
app.use(errorMiddleware);

module.exports = app;
