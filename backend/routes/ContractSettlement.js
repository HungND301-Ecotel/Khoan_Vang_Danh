const router = require("express").Router();
const ContractSettlementController = require("../controller/ContractSettlement");

router.get("/getMonth", ContractSettlementController.getMonth);
router.get("/getQuarter", ContractSettlementController.getQuarter);


module.exports = router;
