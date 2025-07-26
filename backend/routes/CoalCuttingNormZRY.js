const router=require('express').Router()
const CoalCuttingNormZRYController=require('../controller/CoalCuttingNormZRY')

router.post('/',CoalCuttingNormZRYController.create)
router.put('/:id',CoalCuttingNormZRYController.update)
router.delete('/:id',CoalCuttingNormZRYController.delete)
router.get('/',CoalCuttingNormZRYController.get)

module.exports=router