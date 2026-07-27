const router = require('express').Router();
const InitialPlannedCostController = require('./initial-planned-cost.controller');
const { verifyToken } = require('../../../shared/middleware/auth.middleware');
const {
  validateBody,
  validateParams,
} = require('../../../shared/middleware/validation.middleware');
const {
  createSchema,
  updateSchema,
  idSchema,
  batchSchema,
  deleteBatchSchema,
  deleteByDepartmentSchema,
  productionScopeParamSchema,
  departmentIdParamSchema,
} = require('./initial-planned-cost.validation');

const ctrl = new InitialPlannedCostController();
router.use(verifyToken);

// ===================== CRUD WITH TRANSACTIONS =====================
router.post('/', validateBody(createSchema), ctrl.create);
router.post('/batch', validateBody(batchSchema), ctrl.createBatch);
router.put('/batch', validateBody(batchSchema), ctrl.updateBatch);
router.delete('/batch', validateBody(deleteBatchSchema), ctrl.deleteBatch);
router.delete('/department', validateBody(deleteByDepartmentSchema), ctrl.deleteByDepartment);
router.put('/:id', validateParams(idSchema), validateBody(updateSchema), ctrl.update);
router.delete('/:id', validateParams(idSchema), ctrl.delete);

// ===================== AGGREGATION ENDPOINTS =====================
router.get('/', ctrl.get); // Cấp 0: departments
router.get('/months', ctrl.getMonths); // Cấp 1: months by department
router.get('/scopes', ctrl.getScopesByMonth); // Cấp 2: productionScopes by month
router.get('/phases', ctrl.getPhasesByScope); // Cấp 3: phases by scope
router.get(
  '/getOne/:productionScope',
  validateParams(productionScopeParamSchema),
  ctrl.getOne,
);
router.get(
  '/getScopesByDepartment/:departmentId',
  validateParams(departmentIdParamSchema),
  ctrl.getScopesByDepartment,
);

module.exports = router;
