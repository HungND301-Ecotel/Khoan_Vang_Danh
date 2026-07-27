const router = require('express').Router();
const MaterialBudgetController = require('./material-budget.controller');
const { verifyToken } = require('../../../shared/middleware/auth.middleware');
const { validateQuery, validateParams } = require('../../../shared/middleware/validation.middleware');
const {
  getQuerySchema,
  getMonthsQuerySchema,
  getScopesQuerySchema,
  getPhasesQuerySchema,
  idSchema,
} = require('./material-budget.validation');

const ctrl = new MaterialBudgetController();

// Áp dụng auth middleware cho tất cả routes
router.use(verifyToken);

// Routes - Thứ tự quan trọng: các route cụ thể phải đặt trước /:id
router.get('/', validateQuery(getQuerySchema), ctrl.get);           // Cấp 0: departments
router.get('/months', validateQuery(getMonthsQuerySchema), ctrl.getMonths);   // Cấp 1: months
router.get('/scopes', validateQuery(getScopesQuerySchema), ctrl.getScopes);   // Cấp 2: scopes
router.get('/phases', validateQuery(getPhasesQuerySchema), ctrl.getPhases);   // Cấp 3: phases
router.get('/:id', validateParams(idSchema), ctrl.getOne);          // Get one

module.exports = router;
