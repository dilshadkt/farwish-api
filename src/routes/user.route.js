const express = require("express");
const { getUserData } = require("../controllers/user.controller");
const verifyUser = require("../middlewares/veirfy.middleware");
const router = express.Router();

router.get("/data", verifyUser, getUserData);

module.exports = router;
