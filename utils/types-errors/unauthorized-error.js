
import httpStatus from "http-status";
import BaseError from "./base-error.js";

export default class UnauthorizedError extends BaseError {
  constructor(message) {
    super("Unauthorized Error", httpStatus.UNAUTHORIZED, message);
  }
}
