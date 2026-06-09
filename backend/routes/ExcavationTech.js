const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const excavationTechController = require("../controller/ExcavationTech");

router.post("/", excavationTechController.create);
router.put("/:id", excavationTechController.update);
router.delete("/", excavationTechController.delete);
router.get("/", excavationTechController.get);
router.post(
  "/importFile",
  upload.single("file"),
  excavationTechController.import
);
router.post("/exportFile", excavationTechController.export);

module.exports = router;
