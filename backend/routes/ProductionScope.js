const router = require("express").Router();
const productionScopeController = require("../controller/ProductionScope");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", productionScopeController.create);
router.put("/:id", productionScopeController.update);
router.delete("/:id", productionScopeController.delete);
router.delete("/", productionScopeController.deleteMany);
router.get("/", productionScopeController.get);
router.post("/exportFile", productionScopeController.export);
router.post(
  "/importFile",
  upload.single("file"),
  productionScopeController.import
);

module.exports = router;
