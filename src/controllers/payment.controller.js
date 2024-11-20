const User = require("../models/account.model");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const WithdrawalRequest = require("../models/withdraw.model");
const createCheckoutSession = async (req, res) => {
  try {
    const { amount, customerName, customerAddress } = req.body;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Funds Transfer",
            },
            unit_amount: amount * 100, // amount in paise
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/settings`,
      customer_email: req.body.email, // Add this if you have the user's email
      payment_intent_data: {
        description: `Funds transfer for ${customerName}`,
      },
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["IN"], // Restrict to India
      },
    });

    res.status(200).json({ id: session.id });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};

const withDraw = async (req, res) => {
  try {
    const { userId, amount, accountNumber, ifscCode, accountHolderName } =
      req.body;

    // Validate user and amount
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.totalEarning < amount || amount < 3) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid withdrawal amount" });
    }

    // Create withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      user: userId,
      amount,
      accountNumber,
      ifscCode,
      accountHolderName,
      status: "pending",
    });

    await withdrawalRequest.save();

    // Update user's balance
    user.totalEarning -= amount;
    await user.save();

    res.json({
      success: true,
      message: "Withdrawal request submitted successfully",
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during the withdrawal process",
    });
  }
};

module.exports = {
  createCheckoutSession,
  withDraw,
};
