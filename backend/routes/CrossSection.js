const router = require("express").Router();
const multer = require("multer");
const CrossSectionController = require("../controller/CrossSection");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", CrossSectionController.create);
router.put("/:id", CrossSectionController.update);
router.delete("/", CrossSectionController.delete);
router.get("/", CrossSectionController.get);
router.post(
  "/importFile",
  upload.single("file"),
  CrossSectionController.import
);
router.post("/exportFile", CrossSectionController.export);

module.exports = router;
