const router = require("express").Router();
const MaterialCostUsedController = require("../controller/MaterialCostUsed");

router.post("/", MaterialCostUsedController.create);
router.post("/batch", MaterialCostUsedController.createBatch);
router.put("/batch", MaterialCostUsedController.updateBatch);

router.put("/:id", MaterialCostUsedController.update);
router.delete("/department", MaterialCostUsedController.deleteByDepartment);
router.delete("/:id", MaterialCostUsedController.delete);

router.get("/", MaterialCostUsedController.get);
router.get("/months", MaterialCostUsedController.getMonths);
router.get("/scopes", MaterialCostUsedController.getScopesByMonth);
router.get("/phases", MaterialCostUsedController.getPhasesByScope);
router.get("/dates", MaterialCostUsedController.getDates);
router.get("/phases-by-date", MaterialCostUsedController.getPhasesByDate);

module.exports = router;
