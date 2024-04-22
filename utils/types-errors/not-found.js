import httpStatus from "http-status";
import BaseError from "./base-error.js";

export default class NotFoundError extends BaseError {
  constructor(message) {
    super("NotFoundError", httpStatus.NOT_FOUND, message);
  }
}
