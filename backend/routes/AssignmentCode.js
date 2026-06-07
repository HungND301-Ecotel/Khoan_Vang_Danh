const router = require('express').Router()
const AssignmentCodeController = require('../controller/assignmentCode.controller')
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })

router.post('/', AssignmentCodeController.create)
router.put('/:id', AssignmentCodeController.update)
router.delete('/', AssignmentCodeController.delete)
router.get('/', AssignmentCodeController.get)
router.post('/exportFile', AssignmentCodeController.export)
router.post('/importFile', upload.single('file'), AssignmentCodeController.import)

module.exports = router