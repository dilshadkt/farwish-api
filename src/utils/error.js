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
  if (error.code === 11000) {
    res.status(400).json({
      success: false,
      message: "Duplicate key error",
      error: {
        field: Object.keys(error.keyPattern)[0],
        value: error.keyValue[Object.keys(error.keyValue)[0]],
        message: `${Object.keys(error.keyPattern)[0]} must be unique`,
      },

    });
  } else {
    // Handle other errors
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

module.exports = { errorHandler };