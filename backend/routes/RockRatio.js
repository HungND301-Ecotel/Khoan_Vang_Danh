const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const RockRatioController = require("../controller/RockRatio");

router.post("/", RockRatioController.create);
router.put("/:id", RockRatioController.update);
router.delete("/", RockRatioController.delete);
router.get("/", RockRatioController.get);
router.post("/importFile", upload.single("file"), RockRatioController.import);
router.post("/exportFile", RockRatioController.export);

module.exports = router;
