import { returnValidationMessageToClient } from "../../utils/return-validation-message-to-client.js";
import { validatorHandlerMiddleware } from "../../middleware/validator-handler-middleware.js";
import { checkExact, param, query } from "express-validator";

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

export { validateGetSubscribersInput, validateGetSubscriberByIdInput };
