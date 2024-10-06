const Joi = require("joi");

const registerSchema = Joi.object({
  firstName:Joi.string().required(),
  lastName:Joi.string().optional(),
  email: Joi.string().email().required(),
  referralCode:Joi.string().optional(),
  password: Joi.string()
    .required()
    .min(8)
    .max(12)
    .custom((value, helpers) => {
      if (!/[A-Z]/.test(value)) {
        return helpers.message(
          "Password must contain at least one uppercase letter",
        );
      }

      if (!/[a-z]/.test(value)) {
        return helpers.message(
          "Password must contain at least one lowercase letter",
        );
      }

      if (!/\d/.test(value)) {
        return helpers.message("Password must contain at least one digit");
      }

      if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        return helpers.message(
          "Password must contain at least one special character",
        );
      }
      return value;
    }),
});

module.exports={ registerSchema }