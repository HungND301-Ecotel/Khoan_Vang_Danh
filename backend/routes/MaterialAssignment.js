const router = require('express').Router()
const materialAssignmentController = require('../controller/MaterialAssignment')

router.post('/', materialAssignmentController.create)
router.put('/:id', materialAssignmentController.update)
router.delete('/:id', materialAssignmentController.delete)
router.get('/', materialAssignmentController.get)


module.exports = router