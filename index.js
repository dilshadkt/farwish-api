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

connectDB();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
console.log("Current NODE_ENV:", process.env.NODE_ENV);
// Apply Rate Limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);
// Apply CORS configuration
app.use(cors(corsOptions));

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
