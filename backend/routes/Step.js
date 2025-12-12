const router = require("express").Router();
const stepController = require("../controller/Step");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", stepController.create);
router.put("/:id", stepController.update);
router.delete("/:id", stepController.delete);
router.get("/", stepController.get);
router.post("/exportFile", stepController.export);
router.post("/importFile", upload.single("file"), stepController.import);

module.exports = router;
