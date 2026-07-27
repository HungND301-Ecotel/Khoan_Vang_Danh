const router = require('express').Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const MaterialAssignmentController = require('./material-assignment.controller');
const { verifyToken } = require('../../shared/middleware/auth.middleware');
const {
  validateBody,
  validateParams,
} = require('../../shared/middleware/validation.middleware');
const {
  createSchema,
  updateSchema,
  idSchema,
  deleteManySchema,
} = require('./material-assignment.validation');

const ctrl = new MaterialAssignmentController();
router.use(verifyToken);

// Custom endpoints
router.get('/get', ctrl.get);
router.get('/getGroup', ctrl.getGroup);
router.get('/getCount', ctrl.getCount);

// CRUD endpoints
router.get('/', ctrl.getById);
router.post('/', validateBody(createSchema), ctrl.create);
router.put(
  '/:id',
  validateParams(idSchema),
  validateBody(updateSchema),
  ctrl.update
);
router.delete('/:id', validateParams(idSchema), ctrl.delete);
router.delete('/', validateBody(deleteManySchema), ctrl.deleteMany);

// Import/Export
router.post('/importFile', upload.single('file'), ctrl.import);
router.post('/exportFile', ctrl.export);

module.exports = router;
