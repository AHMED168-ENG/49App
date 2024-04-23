import { checkExact, body } from "express-validator";
import { validatorHandlerMiddleware } from "../middleware/validator-handler-middleware.js";
import { returnValidationMessageToClient } from "../utils/return-validation-message-to-client.js";

// @data {id}
const validateSetAsReadActivity = [
  body("id")
    .notEmpty()
    .isMongoId()
    .withMessage(
      returnValidationMessageToClient({
        en: "id is required",
        ar: "المعرف مطلوب",
      })
    ),
  validatorHandlerMiddleware,
];


export { validateSetAsReadActivity };
