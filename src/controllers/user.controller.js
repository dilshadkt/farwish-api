const User = require("../models/account.model");

exports.getUserData = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select("-password");
    res.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res
      .status(500)
      .json({ message: "Error fetching user data", error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find(
      {},
      {
        firstName: 1,
        lastName: 1,
        email: 1,
        totalCoins: 1,
        totalEarning: 1,
        referralCode: 1,
        createdAt: 1,
      }
    ).sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching user data" });
  }
};
