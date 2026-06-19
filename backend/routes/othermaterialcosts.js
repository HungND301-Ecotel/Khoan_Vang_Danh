const express = require("express");
const router = express.Router();

const { create, update, delete: deleteCost } = require("../controller/OtherMaterialCost");

router.post("/", create);
router.put("/:id", update);
router.delete("/:id", deleteCost);

module.exports = router;
