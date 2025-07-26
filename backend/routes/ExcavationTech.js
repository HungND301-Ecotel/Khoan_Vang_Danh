const router = require('express').Router()
const excavationTechController = require('../controller/ExcavationTech')

router.post('/', excavationTechController.create)
router.put('/:id', excavationTechController.update)
router.delete('/:id', excavationTechController.delete)
router.get('/', excavationTechController.get)

module.exports = router