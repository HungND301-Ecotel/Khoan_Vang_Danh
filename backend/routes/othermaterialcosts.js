const express = require("express");
const router = express.Router();

const { create, update, delete: deleteCost, get } = require("../controller/OtherMaterialCost");

router.get("/", get);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", deleteCost);

module.exports = router;
