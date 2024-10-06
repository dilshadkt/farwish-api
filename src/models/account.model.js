const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName:{
        type: String,
        required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    referredBy: { type: String }, // The referral code of the referrer
    referredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    referralCode:{
        type: String,
        unique: true
    },
    referralPoint:{
        type: Number,
        default:0
    },
    password: {
      type: String,
      required: true
    },
  },
  { timestamps: true }
);
const generateReferralCode = (userId) => {
    return `${userId.toString().slice(-6)}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    return next(error);
  }
  if (!user.referralCode) {
    user.referralCode = generateReferralCode(user._id);
  }
});

// Compare the given password with the hashed password in the database
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;