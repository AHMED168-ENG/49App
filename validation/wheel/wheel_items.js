import { returnValidationMessageToClient } from "../../utils/return-validation-message-to-client.js";
import { validatorHandlerMiddleware } from "../../middleware/validator-handler-middleware.js";
import { body, checkExact, param } from "express-validator";

const validateCreateWheelItemInput = [
  param("wheelId")
    .isMongoId()
    .withMessage(
      returnValidationMessageToClient({
        en: "The wheel id is not valid",
        ar: "معرف الدورة غير صالح",
      })
    ),

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

  body("value")
    .isInt({ gt: 0 })
    .withMessage(
      returnValidationMessageToClient({
        en: "The value must be greater than 0",
        ar: "القيمة يجب ان تكون اكبر من صفر",
      })
    ),

  body("type")
    .isIn(["point", "money"])
    .withMessage(
      returnValidationMessageToClient({
        en: "The type must be point or money",
        ar: "النوع يجب ان يكون من نوع point او money",
      })
    ),

  body("percentage")
    .isFloat({ gt: 0, lte: 100 })
    .withMessage(
      returnValidationMessageToClient({
        en: "The percentage must be greater than 0 and less than 100",
        ar: "النسبة المئوية يجب ان تكون اكبر من صفر و اقل من 100",
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

const validateUpdateWheelItemInput = [
  param("itemId")
    .isMongoId()
    .withMessage(
      returnValidationMessageToClient({
        en: "The wheel id is not valid",
        ar: "معرف الدورة غير صالح",
      })
    ),

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
    )
    .optional(),

  body("value")
    .isInt({ gt: 0 })
    .withMessage(
      returnValidationMessageToClient({
        en: "The value must be greater than 0",
        ar: "القيمة يجب ان تكون اكبر من صفر",
      })
    )
    .optional(),

  body("type")
    .isIn(["point", "money"])
    .withMessage(
      returnValidationMessageToClient({
        en: "The type must be point or money",
        ar: "النوع يجب ان يكون من نوع point او money",
      })
    )
    .optional(),

  body("percentage")
    .isFloat({ gt: 0, lte: 100 })
    .withMessage(
      returnValidationMessageToClient({
        en: "The percentage must be greater than 0 and less than 100",
        ar: "النسبة المئوية يجب ان تكون اكبر من صفر و اقل من 100",
      })
    )
    .optional(),

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

export { validateCreateWheelItemInput, validateUpdateWheelItemInput };
