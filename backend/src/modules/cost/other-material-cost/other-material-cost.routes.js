const router = require('express').Router();
const OtherMaterialCostController = require('./other-material-cost.controller');
const { verifyToken } = require('../../../shared/middleware/auth.middleware');
const {
  validateBody,
  validateParams,
} = require('../../../shared/middleware/validation.middleware');
const {
  createSchema,
  updateSchema,
  idSchema,
} = require('./other-material-cost.validation');

const ctrl = new OtherMaterialCostController();
router.use(verifyToken);

router.get('/', ctrl.get);
router.post('/', validateBody(createSchema), ctrl.create);
router.put(
  '/:id',
  validateParams(idSchema),
  validateBody(updateSchema),
  ctrl.update
);
router.delete('/:id', validateParams(idSchema), ctrl.delete);

module.exports = router;
