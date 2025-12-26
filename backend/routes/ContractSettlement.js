const router = require("express").Router();
const ContractSettlementController = require("../controller/ContractSettlement");

router.get("/getMonth", ContractSettlementController.getMonth);
router.get("/getQuarter", ContractSettlementController.getQuarter);
router.post("/getExcel", ContractSettlementController.getExcel);
router.post("/getExcelM3", ContractSettlementController.getExcelM3);



module.exports = router;
