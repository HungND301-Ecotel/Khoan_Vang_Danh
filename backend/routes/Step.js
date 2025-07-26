const router = require('express').Router()
const stepController = require('../controller/Step')

router.post('/', stepController.create)
router.put('/:id', stepController.update)
router.delete('/:id', stepController.delete)
router.get('/', stepController.get)

module.exports = router