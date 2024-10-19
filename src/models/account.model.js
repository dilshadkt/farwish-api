const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();
const crypto = require("crypto");
const { type } = require("os");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "superAdmin"],
      default: "user",
    },
    referredBy: { type: String }, // The referral code of the referrer
    referredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    referralLink: {
      type: String,
    },
    referralCode: {
      type: String,
      unique: true,
    },
    referralPoint: {
      type: Number,
      default: 0,
    },
    totalEarning: {
      type: Number,
      default: 150,
    },
    earningsByRefferal: {
      type: Number,
      default: 0,
    },
    totalCoins: {
      type: Number,
      default: 0,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
const generateUniqueId = (userId) => {
  const cryptoId = crypto.randomBytes(4).toString("hex");
  return `${cryptoId}`;
};
const generateReferralLink = (userReferralCode) => {
  return `${process.env.FRONTEND_REGISTER_URL}?referral=${userReferralCode}`;
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    return next(error);
  }
});

userSchema.post("save", async function (doc, next) {
  if (!this.referralCode) {
    this.referralCode = generateUniqueId(this._id);
    this.referralLink = generateReferralLink(this.referralCode);
    await this.save();
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
