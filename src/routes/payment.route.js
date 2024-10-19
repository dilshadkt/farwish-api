const express = require("express");
const {
  createCheckoutSession,
  withDraw,
} = require("../controllers/payment.controller");

const router = express.Router();
router.post("/create-checkout-session", createCheckoutSession);
router.post("/withdraw", withDraw);

module.exports = router;
