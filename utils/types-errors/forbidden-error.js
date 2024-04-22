import httpStatus from "http-status";
import BaseError from "./base-error.js";

export default class ForbiddenError extends BaseError {
  constructor(message) {
    super("Forbidden Error", httpStatus.FORBIDDEN, message);
  }
}
