const router = require('express').Router()
const RockRatioController = require('../controller/RockRatio')

router.post('/', RockRatioController.create)
router.put('/:id', RockRatioController.update)
router.delete('/:id', RockRatioController.delete)
router.get('/', RockRatioController.get)
router.post('/exportFile', RockRatioController.export)

module.exports = router