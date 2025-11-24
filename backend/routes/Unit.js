const router = require('express').Router()
const unitController = require('../controller/Unit')
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', unitController.create)
router.put('/:id', unitController.update)
router.delete('/', unitController.delete)
router.get('/', unitController.get)
router.post('/exportFile', unitController.export)
router.post('/importFile', upload.single('file'), unitController.import)

module.exports = router