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
  superAdminLogin,
  getDashboardStat,
  getWithdrawal,
  updateWithdrawal,
  logout,
  createRazorpayOrder,
} = require("../controllers/auth.controller");
const { validate } = require("../middlewares/validation.middleware");
const { registerSchema } = require("../utils/auth.validator");
const verifyUser = require("../middlewares/veirfy.middleware");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/admin-login", superAdminLogin);
router.post("/create-checkout-session", createCheckoutSession);
router.get("/register/success", handleSuccessfulPayment);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/forgot-password", forgetPassword);
router.post("/reset-password", resetPassword);
router.get("/dashboard-stats", verifyUser, getDashboardStat);
router.get("/withdrawal-requests", getWithdrawal);
router.put("/withdrawal-requests/:id", updateWithdrawal);
router.post("/create-razorpay-order", createRazorpayOrder);
router.post("/verify-payment", handleSuccessfulPayment);

module.exports = router;
