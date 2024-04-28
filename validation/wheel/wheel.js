import { returnValidationMessageToClient } from "../../utils/return-validation-message-to-client.js";
import { validatorHandlerMiddleware } from "../../middleware/validator-handler-middleware.js";
import { body, checkExact, param } from "express-validator";

const validateCreateWheelInput = [
  body("name")
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        en: "The name must be a string",
        ar: "اسم يجب ان يكون نصا",
      })
    )
    .notEmpty()
    .withMessage(
      returnValidationMessageToClient({
        en: "The name is required",
        ar: "الاسم مطلوب",
      })
    ),

  body("pricePerPoint")
    .isFloat({ gt: 0 })
    .withMessage(
      returnValidationMessageToClient({
        en: "The price per point must be greater than 0",
        ar: "سعر النقطة يجب ان يكون اكبر من صفر",
      })
    ),

  body("isActive")
    .isBoolean({ strict: true })
    .withMessage(
      returnValidationMessageToClient({
        en: "The isActive must be a boolean",
        ar: "النشطة يجب ان تكون من نوع boolean",
      })
    )
    .optional(),

  checkExact([], {
    message: returnValidationMessageToClient({
      en: "Sorry, you are trying to enter fields that are not required",
      ar: "لقد قمت بادخال حقول غير مطلوبة",
    }),
  }),
  validatorHandlerMiddleware,
];

const validateGetWheelInput = [
  param("wheelId")
    .isMongoId()
    .withMessage(
      returnValidationMessageToClient({
        en: "The wheelId must be a mongoId",
        ar: "wheelId يجب ان يكون من نوع mongoId",
      })
    ),
  checkExact([], {
    message: returnValidationMessageToClient({
      en: "Sorry, you are trying to enter fields that are not required",
      ar: "لقد قمت بادخال حقول غير مطلوبة",
    }),
  }),
  validatorHandlerMiddleware,
];

export { validateCreateWheelInput, validateGetWheelInput };
