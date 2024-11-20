const rateLimit = require("express-rate-limit");

const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || "Too many requests",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for specific IPs or development
      return process.env.NODE_ENV === "development" && req.ip === "127.0.0.1";
    },
    handler: (req, res) => {
      res.status(429).json({
        status: "error",
        message: options.message || "Too many requests",
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      });
    },
  });
};

module.exports = {
  globalLimiter: createRateLimiter({
    max: process.env.NODE_ENV === "production" ? 100 : 1000,
    message: "Too many requests, please try again later.",
  }),

  authLimiter: createRateLimiter({
    max: 5,
    message: "Too many authentication attempts, please try again later.",
  }),

  paymentLimiter: createRateLimiter({
    max: 10,
    message: "Too many payment attempts, please try again later.",
  }),
};
