import { validationResult } from "express-validator";
import httpStatus from "http-status";

const validatorHandlerMiddleware = (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ errors: errors.array() });
    }

    return next();
  } catch (error) {
    next(error);
  }
};

export { validatorHandlerMiddleware };
