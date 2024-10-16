const express = require("express");
const { getCourses } = require("../controllers/course.controller");
const verifyUser = require("../middlewares/veirfy.middleware");
const router = express.Router();

router.get("/", verifyUser, getCourses);
module.exports = router;
