const router = require('express').Router()
const lengthController = require('../controller/Length')

router.post('/', lengthController.create)
router.put('/:id', lengthController.update)
router.delete('/:id', lengthController.delete)
router.get('/', lengthController.get)

module.exports = router