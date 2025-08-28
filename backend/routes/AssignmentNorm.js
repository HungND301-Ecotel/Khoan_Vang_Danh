const router = require("express").Router();
const AssignmentNormController = require("../controller/AssignmentNorm");

router.post("/", AssignmentNormController.create);
router.put("/:id", AssignmentNormController.update);
router.delete("/", AssignmentNormController.delete);
router.get("/", AssignmentNormController.get);

module.exports = router;