import { validationResult } from "express-validator";
import httpStatus from "http-status";

const handel_validation_errors = (req, res, next) => {
  // -> 1) Default to English if language is not specified
  const { language } = req.headers || "en"; 
  const newError = {};
  const param = [];
  const errors = validationResult(req);

  // -> 2) If there are no errors, proceed to the next middleware
  if (errors.isEmpty()) {
    return next();
  }

  // -> 3) If there are errors, extract the error messages
  errors.array().forEach((element) => {
    console.log(element);
    const errorMessage = element.msg[language] || element.msg["en"]; // Fallback to English if language is not available
    if (!param.includes(element.param ?? element.path)) {
      param.push(element.param ?? element.path);
      newError[element.param ?? element.path] = [errorMessage];
    } else {
      newError[element.param ?? element.path].push(errorMessage);
    }
  });

  // -> 4) Return the error messages
  return res.status(httpStatus.BAD_REQUEST).json({
    data: newError,
    status: false,
  });
};

export default handel_validation_errors;
