const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.cookies.token; // Get token from cookies instead of headers

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(401).json({ message: "Invalid token" });
  }
};
