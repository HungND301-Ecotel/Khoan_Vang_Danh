const router = require("express").Router();
const materialAssignmentController = require("../controller/MaterialAssignment");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", materialAssignmentController.create);
router.put("/:id", materialAssignmentController.update);
router.delete("/:id", materialAssignmentController.delete);
router.get("/", materialAssignmentController.get);
router.get("/group", materialAssignmentController.getGroup);
router.get("/getFilter", materialAssignmentController.getFilter);
router.post("/exportFile", materialAssignmentController.export);
router.post(
  "/importFile",
  upload.single("file"),
  materialAssignmentController.import
);

module.exports = router;
