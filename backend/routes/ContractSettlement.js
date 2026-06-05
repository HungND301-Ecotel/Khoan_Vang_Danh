const router = require("express").Router();
const ContractSettlementController = require("../controller/ContractSettlement");

router.get("/getMonth", ContractSettlementController.getMonth);
router.get("/getQuarter", ContractSettlementController.getQuarter);
router.post("/getExcel", ContractSettlementController.getExcel);
router.get("/getDashboardData", ContractSettlementController.getDashboardData);
router.patch("/updateMaterialAssignmentCode", ContractSettlementController.updateMaterialAssignmentCode);

module.exports = router;
