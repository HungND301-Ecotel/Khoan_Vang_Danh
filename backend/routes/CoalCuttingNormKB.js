const router = require('express').Router()
const CoalCuttingNormKBController = require('../controller/CoalCuttingNormKB')

router.post('/', CoalCuttingNormKBController.create)
router.put('/:id', CoalCuttingNormKBController.update)
router.delete('/:id', CoalCuttingNormKBController.delete)
router.get('/', CoalCuttingNormKBController.get)

module.exports = router