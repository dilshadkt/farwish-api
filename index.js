// require("dotenv").config();
// const express = require("express");
// const app = express();
// const helmet = require("helmet");
// const connectDB = require("./src/config/db");
// const authRoutes = require("./src/routes/auth.route");
// const courseRoutes = require("./src/routes/course.route");
// const userRoutes = require("./src/routes/user.route");
// const paymentRoutes = require("./src/routes/payment.route");
// const rateLimit = require("express-rate-limit");
// const cookieParser = require("cookie-parser");

// const port = process.env.PORT || 3000;
// const cors = require("cors");
// const { urlNotFound } = require("./src/utils/urlNotFound");
// const { errorHandler } = require("./src/utils/error");
// const corsOptions = require("./src/utils/cors.config");

// connectDB();

// app.use(helmet());
// app.use(express.json());
// app.use(cookieParser());
// console.log("Current NODE_ENV:", process.env.NODE_ENV);
// // Apply Rate Limiting
// const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
// app.use(limiter);
// // Apply CORS configuration
// app.use(cors(corsOptions));

// // Define authentication routes
// app.use("/api/auth", authRoutes);
// app.use("/api/course", courseRoutes);
// app.use("/api/user", userRoutes);
// app.use("/api/payment", paymentRoutes);

// app.use("*", urlNotFound);

// app.use(errorHandler);
// app.listen(port, () => {
//   console.log(`Server is running on Port: ${port}`);
// });
require("dotenv").config();
const express = require("express");
const app = express();
const helmet = require("helmet");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/auth.route");
const courseRoutes = require("./src/routes/course.route");
const userRoutes = require("./src/routes/user.route");
const paymentRoutes = require("./src/routes/payment.route");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 3000;
const cors = require("cors");
const { urlNotFound } = require("./src/utils/urlNotFound");
const { errorHandler } = require("./src/utils/error");
const corsOptions = require("./src/utils/cors.config");

// Connect to database
connectDB();

// Trust proxy - this should come before other middleware
if (process.env.NODE_ENV === "production") {
  // If you're behind a reverse proxy (Nginx, etc)
  app.set("trust proxy", 1);
}

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
      },
    },
  })
);

// Basic middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // Limit each IP
  standardHeaders: true,
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
  handler: (req, res) => {
    res.status(429).json({
      status: "error",
      message: "Too many requests, please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

// Apply different rate limits for different routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Stricter limit for auth routes
  message: {
    status: 429,
    message: "Too many authentication attempts, please try again later.",
  },
});

// CORS configuration
app.use(cors(corsOptions));

// Global rate limiter
app.use(limiter);

// Routes with specific rate limits
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes);

// Error handling
app.use("*", urlNotFound);
app.use(errorHandler);

// Add basic health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", environment: process.env.NODE_ENV });
});

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log("Received shutdown signal. Closing server...");
  server.close(() => {
    console.log("Server closed. Process terminating...");
    process.exit(0);
  });
};

// Create HTTP server
const server = app.listen(port, () => {
  console.log(`Server is running on Port: ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Handle shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Handle uncaught exceptions and rejections
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown();
});

module.exports = app;
