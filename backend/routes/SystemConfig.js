const express = require("express");
const router = express.Router();
const systemConfigController = require("../controller/SystemConfig");

router.get("/", systemConfigController.getConfigs);
router.post("/", systemConfigController.createConfig);
router.put("/:key", systemConfigController.updateConfig);

module.exports = router;
