const router = require('express').Router()
const DeviceCodeController = require('../controller/DeviceCode')

router.post('/', DeviceCodeController.create)
router.put('/:id', DeviceCodeController.update)
router.delete('/:id', DeviceCodeController.delete)
router.get('/', DeviceCodeController.get)

module.exports = router