const router = require('express').Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const AssignmentCodeController = require('./assignment-code.controller');
const { verifyToken } = require('../../shared/middleware/auth.middleware');
const { validateBody, validateParams } = require('../../shared/middleware/validation.middleware');
const { createSchema, updateSchema, idSchema, deleteManySchema } = require('./assignment-code.validation');

const ctrl = new AssignmentCodeController();
router.use(verifyToken);

router.get('/', ctrl.get);
router.post('/', validateBody(createSchema), ctrl.create);
router.put('/:id', validateParams(idSchema), validateBody(updateSchema), ctrl.update);
router.delete('/:id', validateParams(idSchema), ctrl.delete);
router.delete('/', validateBody(deleteManySchema), ctrl.deleteMany);
router.post('/importFile', upload.single('file'), ctrl.import);
router.post('/exportFile', ctrl.export);

module.exports = router;
