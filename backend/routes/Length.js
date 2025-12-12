const router = require("express").Router();
const lengthController = require("../controller/Length");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", lengthController.create);
router.put("/:id", lengthController.update);
router.delete("/:id", lengthController.delete);
router.get("/", lengthController.get);
router.post("/exportFile", lengthController.export);
router.post("/importFile", upload.single("file"), lengthController.import);

module.exports = router;
