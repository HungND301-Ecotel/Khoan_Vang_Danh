const router = require('express').Router();
const MaterialCostUsedController = require('./material-cost-used.controller');
const { verifyToken } = require('../../../shared/middleware/auth.middleware');
const { validateBody, validateParams } = require('../../../shared/middleware/validation.middleware');
const {
  createSchema,
  batchSchema,
  updateSchema,
  idSchema,
  deleteByDepartmentSchema,
} = require('./material-cost-used.validation');

const ctrl = new MaterialCostUsedController();
router.use(verifyToken);

// Level 0: departments
router.get('/', ctrl.get);

// Level 1: months
router.get('/months', ctrl.getMonths);

// Level 2: scopes
router.get('/scopes', ctrl.getScopes);

// Level 3: phases
router.get('/phases', ctrl.getPhases);

// Create
router.post('/', validateBody(createSchema), ctrl.create);

// Create batch
router.post('/batch', validateBody(batchSchema), ctrl.createBatch);

// Update batch
router.put('/batch', validateBody(batchSchema), ctrl.updateBatch);

// Update
router.put('/:id', validateParams(idSchema), validateBody(updateSchema), ctrl.update);

// Delete by department
router.delete('/department', validateBody(deleteByDepartmentSchema), ctrl.deleteByDepartment);

// Delete batch
router.delete('/batch', ctrl.deleteBatch);

// Delete single
router.delete('/:id', validateParams(idSchema), ctrl.delete);

module.exports = router;
