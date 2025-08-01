const router = require('express').Router()
const AdjustmentNormController = require('../controller/AdjustmentNorm')

router.post('/', AdjustmentNormController.create)
router.put('/:id', AdjustmentNormController.update)
router.delete('/:id', AdjustmentNormController.delete)
router.get('/', AdjustmentNormController.get)

module.exports = router