const allowedOrigins = [
  "https://farwish.vercel.app",
  "https://www.earnfarwish.com",
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

module.exports = corsOptions;
