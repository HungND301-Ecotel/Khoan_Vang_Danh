const router = require('express').Router()
const InitialPlannedCostController = require('../controller/InitialPlannedCost')

router.post('/', InitialPlannedCostController.create)
router.put('/:id', InitialPlannedCostController.update)
router.delete('/:id', InitialPlannedCostController.delete)
router.get('/', InitialPlannedCostController.get)
router.get('/getOne/:productionScope', InitialPlannedCostController.getOne)
router.get('/getScopesByDepartment/:departmentId', InitialPlannedCostController.getScopesByDepartment)


module.exports = router