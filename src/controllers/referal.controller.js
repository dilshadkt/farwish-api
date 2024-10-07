const User = require("../models/account.model");

const POINTS_PER_REFERRAL = 10;
const POINTS_THRESHOLD_FOR_CASH = 100;
const CASH_REWARD = 10; // $10 for every 100 points

exports.processReferral = async (referralCode, newUserId) => {
  try {
    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      throw new Error("Invalid referral code");
    }

    const newUser = await User.findById(newUserId);
    if (!newUser) {
      throw new Error("New user not found");
    }

    // Update the new user with the referrer's ID
    newUser.referredBy = referrer._id;
    await newUser.save();

    // Update the referrer's points and referrals
    referrer.referralPoints += POINTS_PER_REFERRAL;
    referrer.referrals.push(newUser._id);

    // Check if the referrer has reached the points threshold for a cash reward
    if (referrer.referralPoints >= POINTS_THRESHOLD_FOR_CASH) {
      const cashRewards = Math.floor(
        referrer.referralPoints / POINTS_THRESHOLD_FOR_CASH
      );
      const cashAmount = cashRewards * CASH_REWARD;

      // Here you would typically call a payment service to send the cash reward
      // For this example, we'll just log it
      console.log(
        `Sending cash reward of $${cashAmount} to user ${referrer._id}`
      );

      // Subtract the rewarded points
      referrer.referralPoints %= POINTS_THRESHOLD_FOR_CASH;
    }

    await referrer.save();

    return { success: true, message: "Referral processed successfully" };
  } catch (error) {
    console.error("Error processing referral:", error);
    return { success: false, message: error.message };
  }
};
