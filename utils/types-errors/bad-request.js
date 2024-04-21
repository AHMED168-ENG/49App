import httpStatus from "http-status";
import BaseError from "./base-error.js";

export default class BadRequestError extends BaseError {
  constructor(message) {
    super("Bad Request", httpStatus.BAD_REQUEST, message);
  }
}
