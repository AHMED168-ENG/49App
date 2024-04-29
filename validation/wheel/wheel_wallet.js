import { returnValidationMessageToClient } from "../../utils/return-validation-message-to-client.js";
import { validatorHandlerMiddleware } from "../../middleware/validator-handler-middleware.js";
import { checkExact, param, query } from "express-validator";

const validateGetWheelWalletInput = [
  param("walletId")
    .isMongoId()
    .withMessage(
      returnValidationMessageToClient({
        en: "The wallet id is not valid",
        ar: "معرف المحفظة غير صالح",
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

const validateGetWheelWalletsInput = [
  query("page")
    .isInt({ min: 1 })
    .withMessage(
      returnValidationMessageToClient({
        en: "The page is not valid",
        ar: "الصفحة غير صالحة",
      })
    )
    .optional(),

  query("limit")
    .isInt()
    .withMessage(
      returnValidationMessageToClient({
        en: "The limit is not valid",
        ar: "الحد غير صالح",
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

export { validateGetWheelWalletInput, validateGetWheelWalletsInput };
