const router = require('express').Router()
const curbSlopeController = require('../controller/CurbSlope')

router.post('/', curbSlopeController.create)
router.put('/:id', curbSlopeController.update)
router.delete('/:id', curbSlopeController.delete)
router.get('/', curbSlopeController.get)

module.exports = router