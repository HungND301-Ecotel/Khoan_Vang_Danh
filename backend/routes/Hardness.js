const router = require("express").Router();
const hardnessController = require("../controller/Hardness");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", hardnessController.create);
router.put("/:id", hardnessController.update);
router.delete("/", hardnessController.delete);
router.get("/", hardnessController.get);
router.post("/exportFile", hardnessController.export);
router.post("/importFile", upload.single("file"), hardnessController.import);

module.exports = router;
