const router = require("express").Router();
const ContractSettlementController = require("../controller/ContractSettlement");

router.get("/getMonth", ContractSettlementController.getMonth);

module.exports = router;
