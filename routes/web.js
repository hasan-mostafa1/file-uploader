const { Router } = require("express");
const authController = require("../controllers/authController");

const router = Router();

router.get("/", authController.home);

// Auth
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/profile", authController.profile);
router.post("/logout", authController.logout);

module.exports = router;
