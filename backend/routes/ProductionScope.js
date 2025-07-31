const router = require('express').Router()
const ProductionScopeController = require('../controller/ProductionScope')

router.post('/', ProductionScopeController.create)
router.put('/:id', ProductionScopeController.update)
router.delete('/:id', ProductionScopeController.delete)
router.get('/', ProductionScopeController.get)

module.exports = router