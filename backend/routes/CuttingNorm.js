const router=require('express').Router()
const CuttingNormController=require('../controller/CuttingNorm')

router.post('/',CuttingNormController.create)
router.put('/:id',CuttingNormController.update)
router.delete('/:id',CuttingNormController.delete)
router.get('/',CuttingNormController.get)

module.exports=router