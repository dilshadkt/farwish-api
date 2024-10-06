require("dotenv").config();

/**
 * This function will handle the exception and return the Response
 *
 * @param {*} error
 * @param {*} req
 * @param {*} res
 * @returns response with message and status code
 */
const errorHandler = (error, req, res, next) => {
      responseMessage = error || { message: "Internal server error" };
  if (process.env.NODE_ENV === "production" ? null : error.stack)
    responseMessage.stack = error.stack;
  return res.status(500).json(responseMessage);
};

module.exports = { errorHandler };