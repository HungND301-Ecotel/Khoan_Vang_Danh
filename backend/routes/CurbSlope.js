const router = require("express").Router();
const curbSlopeController = require("../controller/CurbSlope");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", curbSlopeController.create);
router.put("/:id", curbSlopeController.update);
router.delete("/", curbSlopeController.delete);
router.get("/", curbSlopeController.get);
router.post("/exportFile", curbSlopeController.export);
router.post("/importFile", upload.single("file"), curbSlopeController.import);

module.exports = router;
