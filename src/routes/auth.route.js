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
  checkUserExist,

  getSingleWithdrawal,
} = require("../controllers/auth.controller");
const { validate } = require("../middlewares/validation.middleware");
const { registerSchema } = require("../utils/auth.validator");
const verifyUser = require("../middlewares/veirfy.middleware");

const router = express.Router();

router.post("/verify", verifyUser, checkUserExist);

// auth related route 👨‍🏭👨‍🏭
router.post("/register", validate(registerSchema), register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/admin-login", superAdminLogin);

// payment related route ⚒️⚒️
router.post("/create-razorpay-order", createRazorpayOrder);
router.post("/verify-payment", handleSuccessfulPayment);
router.post("/create-checkout-session", createCheckoutSession);
router.get("/register/success", handleSuccessfulPayment);

// forget password section 🔑🔑
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/forgot-password", forgetPassword);
router.post("/reset-password", resetPassword);

// some dashboad thinks like the total counts and some thing 😒😒
router.get("/dashboard-stats", verifyUser, getDashboardStat);
router.get("/withdrawal-requests", verifyUser, getWithdrawal);
router.get("/withdrawal-requests/:id", verifyUser, getSingleWithdrawal);
router.put("/withdrawal-requests/:id", verifyUser, updateWithdrawal);

module.exports = router;
