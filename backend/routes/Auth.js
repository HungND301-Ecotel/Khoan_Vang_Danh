const router = require("express").Router();
const AuthController = require("../controller/Auth");

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/:id/changepass", AuthController.changePass);

module.exports = router;
