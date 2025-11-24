const router = require('express').Router()
const DeviceCodeController = require('../controller/DeviceCode')
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', DeviceCodeController.create)
router.put('/:id', DeviceCodeController.update)
router.delete('/', DeviceCodeController.delete)
router.get('/', DeviceCodeController.get)
router.post('/exportFile', DeviceCodeController.export)
router.post('/importFile', upload.single('file'), DeviceCodeController.import)

module.exports = router