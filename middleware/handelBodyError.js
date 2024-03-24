import { validationResult } from "express-validator";
import httpStatus from "http-status";


const handel_validation_errors = (req , res, next) => {
    let newError = {}
    let param = [];
    let errors = [];
    let Errors = validationResult(req)

    if (!Errors.isEmpty()) {
      errors = Errors.errors
    } else {
      return next()
    }
    errors?.forEach((element) => {
      if (!param.includes(element.param ?? element.path)) {
        param.push(element.param ?? element.path);
        newError[element.param ?? element.path] = [element];
      } else {
        newError[element.param ?? element.path].push(element);
      }
    });
    return res.status(httpStatus.BAD_REQUEST).json({
      data: newError,
      status : false
    });
  }

export default handel_validation_errors