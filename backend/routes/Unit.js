const router = require('express').Router()
const unitController = require('../controller/Unit')

router.post('/', unitController.create)
router.put('/:id', unitController.update)
router.delete('/:id', unitController.delete)
router.get('/', unitController.get)

module.exports = router