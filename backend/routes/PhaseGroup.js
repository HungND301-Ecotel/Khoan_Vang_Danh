const router=require('express').Router()
const phaseGroupController=require('../controller/PhaseGroup')

router.post('/',phaseGroupController.create)
router.put('/:id',phaseGroupController.update)
router.delete('/:id',phaseGroupController.delete)
router.get('/',phaseGroupController.get)

module.exports=router