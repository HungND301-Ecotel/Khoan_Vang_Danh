const router = require('express').Router()
const MaterialBudgetController = require('../controller/MaterialBudget')

router.post('/', MaterialBudgetController.create)
router.put('/:id', MaterialBudgetController.update)
router.delete('/:id', MaterialBudgetController.delete)
router.get('/', MaterialBudgetController.get)
router.get('/getOne/:id', MaterialBudgetController.getOne)


module.exports = router