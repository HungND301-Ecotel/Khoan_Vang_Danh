const router = require('express').Router()
const MirrorRatioController = require('../controller/MirrorRatio')

router.post('/', MirrorRatioController.create)
router.put('/:id', MirrorRatioController.update)
router.delete('/:id', MirrorRatioController.delete)
router.get('/', MirrorRatioController.get)
router.post('/exportFile', MirrorRatioController.export)

module.exports = router