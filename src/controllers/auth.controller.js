const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../models/account.model");
const nodemailer = require("nodemailer");
const WithdrawalRequest = require("../models/withdraw.model");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Razorpay = require("razorpay");
const createEmailTemplate = require("../constant");

const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: true, // Always use secure cookies
    sameSite: "none", // Allows cross-site cookie setting
    domain: process.env.COOKIE_DOMAIN || "localhost",
    path: "/",
    maxAge: 3600000, // 1 hour
  });
};
// Register a new user
const register = async (req, res, next) => {
  const { firstName, lastName, email, password, referralCode } =
    req.validatedData;

  try {
    const user = new User({ firstName, lastName, email, password });
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        user.referredBy = referrer.referralCode;
        referrer.referredUsers.push(user._id);
        // referrer.referralPoint = referrer.referralPoint + 150;
        referrer.referralPoint = referrer.referralPoint + 1.5;
        // referrer.totalEarning += 150;
        referrer.totalEarning += 1.5;
        referrer.totalCoins += 1;
        await referrer.save();
      } else {
        return res.status(400).json({ message: "Invalid referral code" });
      }
    }
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1 hour",
    });
    setTokenCookie(res, token);
    return res.status(201).json({ token });
  } catch (error) {
    next(error);
  }
};

// Login with an existing user
const login = async (req, res, next) => {
  console.log(req.body);
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await user.comparePassword(password);

    if (!passwordMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1 hour",
    });
    setTokenCookie(res, token);
    return res.json({ isSuperAdmin: false, user, token });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};
const logout = (req, res) => {
  try {
    // Clear the authentication cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "An error occurred during logout" });
  }
};
const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email, role: "superAdmin" });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: admin._id, role: "superAdmin" },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );
    admin.role = "superAdmin";
    // setTokenCookie(res, token);
    res.json({ isSuperAdmin: true, user: admin, token });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
};

const createCheckoutSession = async (req, res, next) => {
  const { email, firstName, lastName, password, referralCode } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "User Registration",
            },
            unit_amount: 49900, // $499.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:3030/api/auth/register/success?session_id={CHECKOUT_SESSION_ID}`, // Point to the backend
      cancel_url: `http://localhost:3000/register`, // You can keep the cancel URL on the frontend
      client_reference_id: email,
      metadata: {
        firstName,
        lastName,
        password,
        referralCode,
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// const handleSuccessfulPayment = async (req, res) => {
//   const { session_id } = req.query;

//   try {
//     const session = await stripe.checkout.sessions.retrieve(session_id);

//     if (session.payment_status === "paid") {
//       const { client_reference_id, metadata } = session;
//       const referalCode = metadata.referralCode;
//       // Use the metadata to get user data
//       const userData = {
//         email: client_reference_id,
//         firstName: metadata.firstName,
//         lastName: metadata.lastName,
//         password: metadata.password,
//       };

//       // Create the user
//       const user = new User({
//         ...userData,
//       });

//       // Handle referral if a referral code was provided
//       if (referalCode.length > 0) {
//         const referrer = await User.findOne({
//           referralCode: referalCode,
//         });
//         if (referrer) {
//           user.referredBy = referrer.referralCode;
//           referrer.referredUsers.push(user._id);
//           referrer.referralPoint += 150;
//           referrer.totalEarning += 150;
//           referrer.earningsByRefferal += 150;
//           referrer.totalCoins += 1;
//           await referrer.save();
//         } else {
//           // If an invalid referral code is provided, we'll still create the user but without the referral
//           console.log("Invalid referral code provided:", userData.referralCode);
//         }
//       }

//       // Save the user
//       await user.save();

//       // Generate JWT token
//       const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
//         expiresIn: "1 hour",
//       });
//       // Set token as HTTP-only cookie
//       setTokenCookie(res, token);
//       // Redirect to a frontend success page with the token
//       res.redirect(
//         `${process.env.FRONTEND_URL}/registration-complete?token=${token}`
//       );
//     } else {
//       res.status(400).json({ message: "Payment was not successful" });
//     }
//   } catch (error) {
//     console.error("Error handling successful payment:", error);
//     res.status(500).json({ error: "An error occurred during registration" });
//   }
// };

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_NAME,
    pass: process.env.APP_PASSWORD,
  },
});
// Store OTPs temporarily
const otpStore = new Map();

const sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP
    otpStore.set(email, otp);

    // Send email
    await transporter.sendMail({
      from: {
        name: "FARWISH",
        address: process.env.EMAIL_FROM,
      },
      to: email,
      subject: "Your OTP for Registration",
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      html: createEmailTemplate(otp),
    });

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Error sending OTP" });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (otpStore.get(email) === otp) {
    otpStore.delete(email);
    res.json({ message: "OTP verified successfully" });
  } else {
    res.status(400).json({ message: "Invalid OTP" });
  }
};

const forgetPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, otp);

  // Send OTP via email
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP for password reset is: ${otp}`,
  });

  res.json({ message: "OTP sent to email" });
};
const resetPassword = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.password = password; // Assuming you have a pre-save hook to hash the password
  await user.save();

  res.json({ message: "Password reset successfully" });
};

const getDashboardStat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (user.role !== "superAdmin") {
      return res.status(201).json({ message: "unauthorized" });
    }
    const totalUsers = await User.countDocuments({
      role: { $ne: "superAdmin" },
    });
    const totalWithdrawalRequests = await WithdrawalRequest.countDocuments();
    const pendingWithdrawalRequests = await WithdrawalRequest.countDocuments({
      status: "pending",
    });

    res.json({
      totalUsers,
      totalWithdrawalRequests,
      pendingWithdrawalRequests,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching dashboard stats" });
  }
};

const getWithdrawal = async (req, res) => {
  try {
    const withdrawalRequests = await WithdrawalRequest.find()
      .populate("user", "email firstName lastName ")
      .sort({ createdAt: -1 });

    res.json(withdrawalRequests);
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    res.status(500).json({
      message: "An error occurred while fetching withdrawal requests",
    });
  }
};
const getSingleWithdrawal = async (req, res) => {
  try {
    const { id } = req.params; // This is the user ID as string

    const withdrawalRequests = await WithdrawalRequest.find()
      .populate("user", "email firstName lastName")
      .sort({ createdAt: -1 });
    console.log(withdrawalRequests);
    // Filter after populating by comparing string versions of the IDs
    const filtered = withdrawalRequests.filter(
      (withdraw) => withdraw.user._id.toString() === id
    );

    res.json(filtered);
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    res.status(500).json({
      message: "An error occurred while fetching withdrawal requests",
      error: error.message,
    });
  }
};

// New route: Update withdrawal request status
const updateWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const withdrawalRequest = await WithdrawalRequest.findByIdAndUpdate(
      id,
      { status, processedAt: Date.now() },
      { new: true }
    );

    if (!withdrawalRequest) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    res.json(withdrawalRequest);
  } catch (error) {
    console.error("Error updating withdrawal request:", error);
    res.status(500).json({
      message: "An error occurred while updating the withdrawal request",
    });
  }
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createRazorpayOrder = async (req, res, next) => {
  const { email, firstName, lastName, password, referralCode } = req.body;
  try {
    const options = {
      amount: 4990, // ₹499 in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        email,
        firstName,
        lastName,
        referralCode,
        password,
      },
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    // Send complete configuration to frontend
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      name: "FARWISH",
      description: "Registration Fee",
      prefill: {
        name: `${firstName} ${lastName}`,
        email: email,
        contact: "+919526558430", // Optional: Add phone number if available
      },
      config: {
        display: {
          blocks: {
            banks: {
              name: "Pay via UPI",
              instruments: [
                {
                  method: "upi",
                  flows: ["intent", "collect"],
                },
              ],
            },
          },
          sequence: ["block.banks"],
          preferences: {
            show_default_blocks: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error in createRazorpayOrder:", error);
    res.status(500).json({ error: error.message });
  }
};

// const createRazorpayOrder = async (req, res, next) => {
//   const { email, firstName, lastName, password, referralCode } = req.body;
//   try {
//     const options = {
//       // amount: 49900,
//       amount: 490,
//       currency: "INR",
//       receipt: `receipt_${Date.now()}`,
//       notes: {
//         email,
//         firstName,
//         lastName,
//         referralCode,
//         password,
//       },
//     };

//     console.log("Razorpay order options:", options);

//     const order = await razorpay.orders.create(options);
//     console.log("Razorpay order created:", order);

//     res.json({
//       orderId: order.id,
//       amount: order.amount,
//       currency: order.currency,
//     });
//   } catch (error) {
//     console.error("Error in createRazorpayOrder:", error);
//     res.status(500).json({ error: error.message, stack: error.stack });
//   }
// };
const handleSuccessfulPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  console.log(req.body);
  try {
    // Verify the payment signature
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
      return res.status(400).json({ message: "Transaction not legit!" });
    }

    // Fetch the order details
    const order = await razorpay.orders.fetch(razorpay_order_id);

    if (order.status === "paid") {
      const { email, firstName, lastName, referralCode, password } =
        order.notes;
      console.log(order.notes);

      // Create the user
      const user = new User({
        email,
        firstName,
        lastName,
        password,
      });

      // Handle referral if a referral code was provided
      if (referralCode) {
        const referrer = await User.findOne({ referralCode });
        if (referrer) {
          user.referredBy = referrer.referralCode;
          referrer.referredUsers.push(user._id);
          // referrer.referralPoint += 150;
          // referrer.totalEarning += 150;
          // referrer.earningsByRefferal += 150;
          referrer.referralPoint += 1.5;
          referrer.totalEarning += 1.5;
          referrer.earningsByRefferal += 1.5;
          referrer.totalCoins += 1;
          await referrer.save();
        } else {
          console.log("Invalid referral code provided:", referralCode);
        }
      }

      // Save the user
      await user.save();

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
        expiresIn: "1 hour",
      });

      // Set token as HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000, // 1 hour
      });

      // Send success response
      res.json({ success: true, message: "Registration successful" });
    } else {
      res.status(400).json({ message: "Payment was not successful" });
    }
  } catch (error) {
    console.error("Error handling successful payment:", error);
    res.status(500).json({ error: "An error occurred during registration" });
  }
};
// 4. Check Razorpay initialization
try {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log("Razorpay initialized successfully");
} catch (error) {
  console.error("Error initializing Razorpay:", error);
}

const checkUserExist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = user.toJSON(); // Convert the user document to a plain object
    delete userData.password; // Remove the password field manually

    res.status(200).json({ user: userData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred during registration" });
  }
};

module.exports = {
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
  getSingleWithdrawal,
  checkUserExist,
};
