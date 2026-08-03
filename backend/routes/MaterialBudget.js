const router = require("express").Router();
const MaterialBudgetController = require("../controller/MaterialBudget");

router.post("/", MaterialBudgetController.create);
router.put("/extra-quantity", MaterialBudgetController.updateExtraQuantity);
router.put("/:id", MaterialBudgetController.update);
router.delete("/:id", MaterialBudgetController.delete);

router.get("/", MaterialBudgetController.get); // Cấp 0
router.get("/months", MaterialBudgetController.getMonths); // Cấp 1
router.get("/scopes", MaterialBudgetController.getScopesByMonth); // Cấp 2
router.get("/phases", MaterialBudgetController.getPhasesByScope); // Cấp 3

router.get("/getOne/:id", MaterialBudgetController.getOne);

module.exports = router;
