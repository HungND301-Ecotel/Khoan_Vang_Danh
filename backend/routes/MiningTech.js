const router = require('express').Router()
const miningTechController = require('../controller/MiningTech')

router.post('/', miningTechController.create)
router.put('/:id', miningTechController.update)
router.delete('/:id', miningTechController.delete)
router.get('/', miningTechController.get)

module.exports = router