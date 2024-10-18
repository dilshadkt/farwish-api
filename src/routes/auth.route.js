const express = require("express");
const {
  register,
  login,
  createCheckoutSession,
  handleSuccessfulPayment,
  sendOTP,
  verifyOTP,
  forgetPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const { validate } = require("../middlewares/validation.middleware");
const { registerSchema } = require("../utils/auth.validator");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", login);
router.post("/create-checkout-session", createCheckoutSession);
router.get("/register/success", handleSuccessfulPayment);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/forgot-password", forgetPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
