const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const ctrl = require("../controller/Department");

router.get("/", ctrl.get);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.deleteOne);
router.delete("/", ctrl.deleteMany);
router.post("/importFile", upload.single("file"), ctrl.import);
router.post("/exportFile", ctrl.export);

module.exports = router;
