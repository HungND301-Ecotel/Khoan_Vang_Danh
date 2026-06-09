const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const phaseController = require("../controller/Phase");

router.post("/", phaseController.create);
router.put("/:id", phaseController.update);
router.delete("/", phaseController.delete);
router.get("/", phaseController.get);
router.post("/importFile", upload.single("file"), phaseController.import);
router.post("/exportFile", phaseController.export);

module.exports = router;
