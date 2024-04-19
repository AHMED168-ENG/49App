import { returnValidationMessageToClient } from "../utils/return-validation-message-to-client.js";
import { validatorHandlerMiddleware } from "../middleware/validator-handler-middleware.js";
import { body, checkExact } from "express-validator";

const validateRegisterInput = [
  body("first_name")
    .notEmpty()
    .withMessage(
      returnValidationMessageToClient({
        en: "first name is required",
        ar: "الاسم الاول مطلوب",
      })
    ),

  body("last_name")
    .notEmpty()
    .withMessage(
      returnValidationMessageToClient({
        en: "last name is required",
        ar: "الاسم الاخير مطلوب",
      })
    ),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage(
      returnValidationMessageToClient({
        en: "invalid email",
        ar: "البريد الالكتروني غير صالح",
      })
    )
    .isLength({ min: 3, max: 128 })
    .withMessage(
      returnValidationMessageToClient({
        en: "email must be between 3 and 128 characters",
        ar: "البريد الالكتروني يجب الا يقل عن 3 و يزيد عن 128 حرف",
      })
    ),

  body("password")
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        en: "Sorry, the password name type must be text",
        ar: "كلمة المرور يجب ان تكون نوعه من نوع نص",
      })
    )
    .notEmpty()
    .withMessage(
      returnValidationMessageToClient({
        en: "Sorry, you cannot leave the password field blank",
        ar: "لا يمكنك ترك حقل كلمة المرور فارغا",
      })
    )
    .isLength({ min: 8, max: 64 })
    .withMessage(
      returnValidationMessageToClient({
        en: "password must be between 8 and 64 characters",
        ar: "كلمة المرور يجب الا يقل عن 8 و يزيد عن 64 حرف",
      })
    )
    .custom((password, { req }) => {
      if (password !== req.body.confirmPassword) {
        throw new Error(
          returnValidationMessageToClient({
            en: "password not duplicated",
            ar: "كلمة المرور غير متطابقة",
          })
        );
      }
      return true;
    }),

  body("confirmPassword")
    .notEmpty()
    .withMessage(
      returnValidationMessageToClient({
        en: "Sorry, you cannot leave the password confirm field blank",
        ar: "لا يمكنك ترك حقل تأكيد كلمة المرور فارغا",
      })
    ),

  body("fcm")
    .notEmpty()
    .withMessage(
      returnValidationMessageToClient({
        en: "fcm is required",
        ar: "fcm مطلوب",
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

const validateVerifyEmailInput = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage(
      returnValidationMessageToClient({
        en: "invalid email",
        ar: "البريد الالكتروني غير صالح",
      })
    )
    .isLength({ min: 3, max: 128 })
    .withMessage(
      returnValidationMessageToClient({
        en: "email must be between 3 and 128 characters",
        ar: "البريد الالكتروني يجب الا يقل عن 3 و يزيد عن 128 حرف",
      })
    ),
  body("otp")
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        en: "Sorry, the otp name type must be text",
        ar: "الرمز التفعيل يجب ان يكون نوعه من نوع نص",
      })
    )
    .notEmpty()
    .withMessage(
      returnValidationMessageToClient({
        en: "Sorry, you cannot leave the otp field blank",
        ar: "لا يمكنك ترك حقل الرمز التفعيل فارغا",
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

const validateLoginInput = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage(
      returnValidationMessageToClient({
        en: "invalid email",
        ar: "البريد الالكتروني غير صالح",
      })
    )
    .isLength({ min: 3, max: 128 })
    .withMessage(
      returnValidationMessageToClient({
        en: "email must be between 3 and 128 characters",
        ar: "البريد الالكتروني يجب الا يقل عن 3 و يزيد عن 128 حرف",
      })
    ),

  body("password")
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        en: "Sorry, the password name type must be text",
        ar: "كلمة المرور يجب ان تكون نوعه من نوع نص",
      })
    )
    .notEmpty()
    .withMessage(
      returnValidationMessageToClient({
        en: "Sorry, you cannot leave the password field blank",
        ar: "لا يمكنك ترك حقل كلمة المرور فارغا",
      })
    )
    .isLength({ min: 8, max: 64 })
    .withMessage(
      returnValidationMessageToClient({
        en: "password must be between 8 and 64 characters",
        ar: "كلمة المرور يجب الا يقل عن 8 و يزيد عن 64 حرف",
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

const validateRefreshTokenInput = [
  body("refreshToken")
    .isJWT()
    .withMessage(
      returnValidationMessageToClient({
        en: "invalid refresh token",
        ar: "الرمز المرجعي غير صالح",
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

export {
  validateRegisterInput,
  validateVerifyEmailInput,
  validateLoginInput,
  validateRefreshTokenInput,
};
