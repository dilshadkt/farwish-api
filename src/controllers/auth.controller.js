const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/account.model");

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
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1 hour",
    });
    return res.json({ token });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };
