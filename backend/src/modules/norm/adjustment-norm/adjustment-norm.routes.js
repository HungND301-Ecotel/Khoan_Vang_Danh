const router = require('express').Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const AdjustmentNormController = require('./adjustment-norm.controller');
const { verifyToken } = require('../../../shared/middleware/auth.middleware');
const {
  validateBody,
  validateParams,
} = require('../../../shared/middleware/validation.middleware');
const {
  createSchema,
  updateSchema,
  idSchema,
  deleteManySchema,
} = require('./adjustment-norm.validation');

const ctrl = new AdjustmentNormController();
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
router.delete('/', validateBody(deleteManySchema), ctrl.deleteMany);
router.post('/importMatrix', upload.single('file'), ctrl.importMatrix);
router.post('/exportMatrix', ctrl.exportMatrix);

module.exports = router;
