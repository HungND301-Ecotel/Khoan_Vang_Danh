const router = require("express").Router();
const thicknessController = require("../controller/Thickness");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", thicknessController.create);
router.put("/:id", thicknessController.update);
router.delete("/:id", thicknessController.delete);
router.get("/", thicknessController.get);
router.post("/exportFile", thicknessController.export);
router.post("/importFile", upload.single("file"), thicknessController.import);

module.exports = router;
