const router = require('express').Router()
const AdjustmentNormController = require('../controller/AdjustmentNorm')
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', AdjustmentNormController.create)
router.put('/:id', AdjustmentNormController.update)
router.delete('/:id', AdjustmentNormController.delete)
router.get('/', AdjustmentNormController.get)
router.post("/exportFile", AdjustmentNormController.export);
router.post(
    "/importFile",
    upload.single("file"),
    AdjustmentNormController.import
);

module.exports = router