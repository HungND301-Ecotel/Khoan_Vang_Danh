const router = require('express').Router()
const rhicknessController = require('../controller/Thickness')

router.post('/', rhicknessController.create)
router.put('/:id', rhicknessController.update)
router.delete('/:id', rhicknessController.delete)
router.get('/', rhicknessController.get)

module.exports = router