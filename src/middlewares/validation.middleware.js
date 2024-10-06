const structuredError = (errors) => {
    const mappedError = {};
    errors.forEach((error) => {
      const key = error.path.join(".");
      if (mappedError[key]) {
        mappedError[key].push(error.message);
      } else {
        mappedError[key] = [error.message];
      }
    });
    return mappedError;
  };

const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
  
    if (error) {
      return res.status(400).json(
        {
          message: "Validation Error",
          details: structuredError(error.details),
        },
      );
    }
    req.validatedData = value;
    next();
  };

module.exports={ validate }