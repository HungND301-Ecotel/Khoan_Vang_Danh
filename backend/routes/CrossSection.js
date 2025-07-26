const router = require('express').Router()
const CrossSectionController = require('../controller/CrossSection')

router.post('/', CrossSectionController.create)
router.put('/:id', CrossSectionController.update)
router.delete('/:id', CrossSectionController.delete)
router.get('/', CrossSectionController.get)

module.exports = router