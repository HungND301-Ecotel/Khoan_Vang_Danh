const router = require("express").Router();
const miningTechController = require("../controller/MiningTech");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", miningTechController.create);
router.put("/:id", miningTechController.update);
router.delete("/:id", miningTechController.delete);
router.get("/", miningTechController.get);
router.post("/exportFile", miningTechController.export);
router.post("/importFile", upload.single("file"), miningTechController.import);

module.exports = router;
