import httpStatus from "http-status";
import BaseError from "./base-error.js";

export default class ConflictError extends BaseError {
  constructor(message) {
    super("Conflict Error", httpStatus.CONFLICT, message);
  }
}
