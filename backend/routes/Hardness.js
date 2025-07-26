const router = require('express').Router()
const hardnessController = require('../controller/Hardness')

router.post('/', hardnessController.create)
router.put('/:id', hardnessController.update)
router.delete('/:id', hardnessController.delete)
router.get('/', hardnessController.get)

module.exports = router