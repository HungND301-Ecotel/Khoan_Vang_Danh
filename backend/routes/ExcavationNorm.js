const router=require('express').Router()
const ExcavationNormController=require('../controller/ExcavationNorm')

router.post('/',ExcavationNormController.create)
router.put('/:id',ExcavationNormController.update)
router.delete('/:id',ExcavationNormController.delete)
router.get('/',ExcavationNormController.get)

module.exports=router