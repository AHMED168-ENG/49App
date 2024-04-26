import { returnValidationMessageToClient } from "../../utils/return-validation-message-to-client.js";
import { validatorHandlerMiddleware } from "../../middleware/validator-handler-middleware.js";
import { body, checkExact, param, query } from "express-validator";

const validateGetSubscribersInput = [
  query("page").optional(),
  query("limit").optional(),
  checkExact([], {
    message: returnValidationMessageToClient({
      en: "Sorry, you are trying to enter fields that are not required",
      ar: "لقد قمت بادخال حقول غير مطلوبة",
    }),
  }),
  validatorHandlerMiddleware,
];

const validateGetSubscriberByIdInput = [
  param("subscriberId")
    .isMongoId()
    .withMessage(
      returnValidationMessageToClient({
        en: "The subscriber id is not valid",
        ar: "معرف المشترك غير صالح",
      })
    ),
  validatorHandlerMiddleware,
];

const validateUpdateSubscriberBlockStatusInput = [
  param("subscriberId")
    .isMongoId()
    .withMessage(
      returnValidationMessageToClient({
        en: "The subscriber id is not valid",
        ar: "معرف المشترك غير صالح",
      })
    ),

  body("isBlocked")
    .isBoolean({ strict: true })
    .withMessage(
      returnValidationMessageToClient({
        en: "isBlocked must be true or false",
        ar: "isBlocked يجب ان يكون true او false",
      })
    ),
  validatorHandlerMiddleware,
];

export {
  validateGetSubscribersInput,
  validateGetSubscriberByIdInput,
  validateUpdateSubscriberBlockStatusInput,
};
