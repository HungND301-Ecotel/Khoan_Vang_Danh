const router=require('express').Router()
const AssignmentCodeController=require('../controller/AssignmentCode')

router.post('/',AssignmentCodeController.create)
router.put('/:id',AssignmentCodeController.update)
router.delete('/',AssignmentCodeController.delete)
router.get('/',AssignmentCodeController.get)

module.exports=router