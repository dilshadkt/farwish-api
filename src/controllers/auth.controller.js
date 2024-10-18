const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/account.model");
const nodemailer = require("nodemailer");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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
        referrer.referralPoint = referrer.referralPoint + 150;
        referrer.totalEarning += 150;
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
    return res.status(201).json({ token });
  } catch (error) {
    next(error);
  }
};

// Login with an existing user
const login = async (req, res, next) => {
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
    return res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
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

const handleSuccessfulPayment = async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      const { client_reference_id, metadata } = session;
      const referalCode = metadata.referralCode;
      // Use the metadata to get user data
      const userData = {
        email: client_reference_id,
        firstName: metadata.firstName,
        lastName: metadata.lastName,
        password: metadata.password,
      };

      // Create the user
      const user = new User({
        ...userData,
      });

      // Handle referral if a referral code was provided
      if (referalCode.length > 0) {
        const referrer = await User.findOne({
          referralCode: referalCode,
        });
        if (referrer) {
          user.referredBy = referrer.referralCode;
          referrer.referredUsers.push(user._id);
          referrer.referralPoint += 150;
          referrer.totalEarning += 150;
          referrer.earningsByRefferal += 150;
          referrer.totalCoins += 1;
          await referrer.save();
        } else {
          // If an invalid referral code is provided, we'll still create the user but without the referral
          console.log("Invalid referral code provided:", userData.referralCode);
        }
      }

      // Save the user
      await user.save();

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
        expiresIn: "1 hour",
      });

      // Redirect to a frontend success page with the token
      res.redirect(
        `${process.env.FRONTEND_URL}/registration-complete?token=${token}`
      );
    } else {
      res.status(400).json({ message: "Payment was not successful" });
    }
  } catch (error) {
    console.error("Error handling successful payment:", error);
    res.status(500).json({ error: "An error occurred during registration" });
  }
};

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
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your OTP for Registration",
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
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

module.exports = {
  register,
  login,
  createCheckoutSession,
  handleSuccessfulPayment,
  sendOTP,
  verifyOTP,
  forgetPassword,
  resetPassword,
};
