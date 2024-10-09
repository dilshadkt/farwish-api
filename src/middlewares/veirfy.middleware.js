const jwt = require("jsonwebtoken");
module.exports = function (req, res, next) {
  const token = req.header("X-auth-token");

  if (!token) return res.status(401).send("Access denied.No token provided");

  try {
    console.log(token);
    const decoded = jwt.verify(token.split(" ")[1], process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(402).send("invalid token");
  }
};
