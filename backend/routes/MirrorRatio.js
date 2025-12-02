const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const MirrorRatioController = require("../controller/MirrorRatio");

router.post("/", MirrorRatioController.create);
router.put("/:id", MirrorRatioController.update);
router.delete("/:id", MirrorRatioController.delete);
router.get("/", MirrorRatioController.get);
router.post("/exportFile", MirrorRatioController.export);
router.post("/importFile", upload.single("file"), MirrorRatioController.import);

module.exports = router;
