const router=require('express').Router()
const MaterialCostUsedController=require('../controller/MaterialCostUsed')

router.post('/',MaterialCostUsedController.create)
router.put('/:id',MaterialCostUsedController.update)
router.delete('/:id',MaterialCostUsedController.delete)
router.get('/',MaterialCostUsedController.get)

module.exports=router