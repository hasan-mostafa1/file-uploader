const { Router } = require("express");
const homeController = require("../controllers/homeController");
const authController = require("../controllers/authController");
const folderController = require("../controllers/folderController");

const router = Router();

router.get("/", homeController.index);

// Auth
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/profile", authController.profile);
router.post("/logout", authController.logout);

router.post("/folders/create", folderController.store);
router.post("/folders/:id/create", folderController.storeChildFolders);
router.get("/folders/:id", folderController.show);
router.get("/folders/:id/edit", folderController.edit);
router.post("/folders/:id/update", folderController.update);
router.post("/folders/:id/delete", folderController.destroy);

module.exports = router;
