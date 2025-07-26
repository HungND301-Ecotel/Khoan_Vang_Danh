const router = require('express').Router()
const CoalCuttingNormZHController = require('../controller/CoalCuttingNormZH')

router.post('/', CoalCuttingNormZHController.create)
router.put('/:id', CoalCuttingNormZHController.update)
router.delete('/:id', CoalCuttingNormZHController.delete)
router.get('/', CoalCuttingNormZHController.get)

module.exports = router