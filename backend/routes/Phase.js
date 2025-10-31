const router = require('express').Router()
const phaseController = require('../controller/Phase')

router.post('/', phaseController.create)
router.put('/:id', phaseController.update)
router.delete('/:id', phaseController.delete)
router.get('/', phaseController.get)
router.post('/exportFile', phaseController.export)

module.exports = router