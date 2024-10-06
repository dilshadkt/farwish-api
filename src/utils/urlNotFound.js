require("dotenv").config();
const { errorHandler } = require("./error");

const urlNotFound = (req, res, next) => {
  errorHandler(
    {
      message: `Cannot ${req.method} ${process.env.PROJECT_URL + req.originalUrl}`,
    },
    req,
    res,
  );
};
module.exports = { urlNotFound };