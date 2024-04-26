import {
  check,
  checkExact,
  validationResult,
  body,
  oneOf,
} from "express-validator";
import { validatorHandlerMiddleware } from "../middleware/validator-handler-middleware.js";
import { returnValidationMessageToClient } from "../utils/return-validation-message-to-client.js";

// @data {name, description, category_id, pricePerRequest, maxSubscriber, withdrawLimit, start_date, end_date, status}
const createCompetitionValidation = [
  body("name")
    .notEmpty()
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        en: "competition name is required",
        ar: "اسم المسابقة مطلوب",
      })
    ),
  body("description")
    .notEmpty()
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        en: "description must be a string",
        ar: "الوصف يجب ان يكون نص",
      })
    ),
  body("category_id")
    .notEmpty()
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        en: "category id is required",
        ar: "معرف الفئة مطلوب",
      })
    ),
  body("pricePerRequest")
    .notEmpty()
    .isNumeric()
    .withMessage(
      returnValidationMessageToClient({
        en: "price per request is required",
        ar: "السعر لكل طلب مطلوب",
      })
    ),
  body("maxSubscriber")
    .notEmpty()
    .isNumeric()
    .withMessage(
      returnValidationMessageToClient({
        en: "max subscribers is required",
        ar: "الحد الأقصى للمشتركين مطلوب",
      })
    ),
  body("withdrawLimit")
    .notEmpty()
    .isNumeric()
    .withMessage(
      returnValidationMessageToClient({
        en: "withdraw limit is required",
        ar: "الحد الأقصى للسحب مطلوب",
      })
    ),

  body("start_date")
    .optional()
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        en: "start date is required",
        ar: "تاريخ البدء مطلوب",
      })
    ),
  body("end_date")
    .optional()
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        en: "end date is required",
        ar: "تاريخ الانتهاء مطلوب",
      })
    ),
  body("status")
    .optional()
    .isBoolean()
    .withMessage(
      returnValidationMessageToClient({
        en: "active is required",
        ar: "الحالة مطلوبة",
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

const updateCompetitionValidation = [
  oneOf(
    [
      body("name").exists().isString(),
      body("description").exists().isString(),
      body("pricePerRequest").exists().isNumeric(),
      body("maxSubscriber").exists().isNumeric(),
      body("withdrawLimit").exists().isNumeric(),
      body("start_date").exists().isString(),
      body("end_date").exists().isString(),
      body("status").exists().isBoolean(),
    ],
    {
      message: returnValidationMessageToClient({
        en: "enter at least one field",
        ar: "ادخل حقل واحد على الأقل",
      }),
    },
  ),
  validatorHandlerMiddleware,
];

export { createCompetitionValidation, updateCompetitionValidation };
