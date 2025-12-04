const router=require('express').Router()
const InitialPlannedCostController=require('../controller/InitialPlannedCost')

router.post('/',InitialPlannedCostController.create)
router.put('/:id',InitialPlannedCostController.update)
router.delete('/:id',InitialPlannedCostController.delete)
router.get('/',InitialPlannedCostController.get)

module.exports=router