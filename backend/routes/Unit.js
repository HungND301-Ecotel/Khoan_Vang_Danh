const router = require('express').Router()
const unitController = require('../controller/Unit')

router.post('/', unitController.create)
router.put('/:id', unitController.update)
router.delete('/', unitController.delete)
router.get('/', unitController.get)
router.post('/exportFile', unitController.export)

module.exports = router