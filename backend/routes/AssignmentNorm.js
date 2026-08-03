const router = require("express").Router();
const AssignmentNormController = require("../controller/AssignmentNorm");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", AssignmentNormController.create);
router.put("/:id", AssignmentNormController.update);
router.delete("/", AssignmentNormController.delete);
router.post("/cloneYear", AssignmentNormController.cloneYear);
router.get("/", AssignmentNormController.get);
router.get("/grouped", AssignmentNormController.getGroupedByCode);
router.get("/byCode/:code", AssignmentNormController.getByCode);
router.get("/years", AssignmentNormController.getYears);
router.post("/exportFile", AssignmentNormController.export);
router.post(
  "/importFile",
  upload.single("file"),
  AssignmentNormController.import,
);

module.exports = router;
