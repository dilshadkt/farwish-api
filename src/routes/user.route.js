const express = require("express");
const { getUserData, getAllUsers } = require("../controllers/user.controller");
const verifyUser = require("../middlewares/veirfy.middleware");
const router = express.Router();

router.get("/data", verifyUser, getUserData);
router.get("/me", verifyUser, getUserData);
// router.get('/users', authMiddleware, superAdminMiddleware, getAllUsers);
router.get("/users", getAllUsers);

module.exports = router;
