import { body, checkExact, param } from "express-validator";
import { validatorHandlerMiddleware } from "../middleware/validator-handler-middleware";

const validateUpdateWalletAmountInput = [
  param("walletId")
    .isMongoId()
    .withMessage(
      returnValidationMessageToClient({
        en: "Invalid wallet id", 
        ar: "معرف المحفظة غير صالح",
      })
    ),

  body("amount")
    .isFloat({ gt: 0 })
    .withMessage(
      returnValidationMessageToClient({
        en: "The amount must be more than 0",
        ar: "المبلغ يجب ان يكون اكبر من صفر",
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

export { validateUpdateWalletAmountInput };
