const express = require("express");
const { getCourses } = require("../controllers/course.controller");

const router = express.Router();

router.get("/", getCourses);
module.exports = router;
