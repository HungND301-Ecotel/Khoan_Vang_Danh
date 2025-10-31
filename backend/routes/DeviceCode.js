const router = require('express').Router()
const DeviceCodeController = require('../controller/DeviceCode')

router.post('/', DeviceCodeController.create)
router.put('/:id', DeviceCodeController.update)
router.delete('/', DeviceCodeController.delete)
router.get('/', DeviceCodeController.get)
router.post('/exportFile', DeviceCodeController.export)

module.exports = router