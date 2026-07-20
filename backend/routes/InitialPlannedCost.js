const router = require("express").Router();
const InitialPlannedCostController = require("../controller/InitialPlannedCost");

router.post("/", InitialPlannedCostController.create);

router.post("/batch", InitialPlannedCostController.createBatch);
router.put("/batch", InitialPlannedCostController.updateBatch);
router.delete("/batch", InitialPlannedCostController.deleteBatch);
router.delete("/department", InitialPlannedCostController.deleteByDepartment);

router.put("/:id", InitialPlannedCostController.update);
router.delete("/:id", InitialPlannedCostController.delete);

router.get("/", InitialPlannedCostController.get); // Cấp 0
router.get("/months", InitialPlannedCostController.getMonths); // Cấp 1
router.get("/scopes", InitialPlannedCostController.getScopesByMonth); // Cấp 2
router.get("/phases", InitialPlannedCostController.getPhasesByScope); // Cấp 3

router.get("/getOne/:productionScope", InitialPlannedCostController.getOne);
router.get(
  "/getScopesByDepartment/:departmentId",
  InitialPlannedCostController.getScopesByDepartment,
);

module.exports = router;
