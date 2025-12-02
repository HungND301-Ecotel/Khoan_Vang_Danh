const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const phaseGroupController = require("../controller/PhaseGroup");

router.post("/", phaseGroupController.create);
router.put("/:id", phaseGroupController.update);
router.delete("/:id", phaseGroupController.delete);
router.get("/", phaseGroupController.get);
router.post("/importFile", upload.single("file"), phaseGroupController.import);
router.post("/exportFile", phaseGroupController.export);

module.exports = router;
