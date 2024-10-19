require("dotenv").config();
const express = require("express");
const app = express();
const helmet = require("helmet");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/auth.route");
const courseRoutes = require("./src/routes/course.route");
const userRoutes = require("./src/routes/user.route");
const paymentRoutes = require("./src/routes/payment.route");
const cookieParser = require("cookie-parser");

const port = process.env.PORT || 3000;
const cors = require("cors");
const { urlNotFound } = require("./src/utils/urlNotFound");
const { errorHandler } = require("./src/utils/error");

connectDB();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Updated CORS configuration
// app.use(
//   cors({
//     // origin: process.env.FRONTEND_URL, // Replace with your frontend URL
//     // origin: "http://localhost:3000", // Replace with your frontend URL
//     origin: "https://farwish.vercel.app", // Replace with your frontend URL
//     credentials: true,
//   })
// );
// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://farwish.vercel.app",
      "http://localhost:3000", // Include this for local development
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options("*", cors(corsOptions));

// Define authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes);

app.use("*", urlNotFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on Port: ${port}`);
});
