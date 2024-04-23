import { check , checkExact } from "express-validator";
import { returnValidationMessageToClient } from "../utils/return-validation-message-to-client.js";
import { validatorHandlerMiddleware } from "../middleware/validator-handler-middleware.js";
export const validationRegisterLoading = () => {
  return [
    check("car_brand")
      .notEmpty()
      .isString()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل براند السيارة",
          en: "enter car brand",
        })
      ),
    check("car_type")
      .notEmpty()
      .isString()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل نوع السيارة",
          en: "enter car type",
        })
      ),
    check("category_id")
      .notEmpty()
      .isString()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل القسم الخاص السيارة",
          en: "enter car category",
        })
      ),
    check("location")
      .notEmpty()
      .isString()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل موقع السيارة",
          en: "enter car location",
        })
      ),
    check("pictures")
      .notEmpty()
      .isArray()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل صور السيارة",
          en: "enter car pictures",
        })
      ),
      checkExact([], {
        message: returnValidationMessageToClient({
          en: "Sorry, you are trying to enter fields that are not required",
          ar: "لقد قمت بادخال حقول غير مطلوبة",
        }),
      }),
      validatorHandlerMiddleware
  ];
};

export const validationLoadingRating = () => {

  return [
    check("category_id")
      .notEmpty()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل القسم الخاص السيارة",
          en: "enter car category",
        })
      ),
    check("ad_id")
      .notEmpty()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل السيارة",
          en: "enter car advertise",
        })
      ),
    check("user_id")
      .notEmpty()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل المستخدم",
          en: "enter user",
        })
      ),
      checkExact([], {
        message: returnValidationMessageToClient({
          en: "Sorry, you are trying to enter fields that are not required",
          ar: "لقد قمت بادخال حقول غير مطلوبة",
        }),
      })
  ];
};

export const requestLoadingValidation = () => {
  return [
    check("category_id")
      .notEmpty()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل القسم الخاص السيارة",
          en: "enter car category",
        })
      ),
    check("receipt_point")
      .notEmpty()
      .isString()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل مكان الوصول",
          en: "enter receipt point",
        })
      ),
    check("delivery_point")
      .notEmpty()
      .isString()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل مكان الوصول",
          en: "enter delivery point",
        })
      ),
    check("price")
      .notEmpty()
      .isNumeric()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل السعر",
          en: "enter price",
        })
      ),
      check("phone")
      .notEmpty()
      .isString()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل رقم الهاتف",
          en: "enter phone number",
        })
      ),
    check("time")
      .notEmpty()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل الموعد",
          en: "enter time",
        })
      ),
      checkExact([], {
        message: returnValidationMessageToClient({
          en: "Sorry, you are trying to enter fields that are not required",
          ar: "لقد قمت بادخال حقول غير مطلوبة",
        }),
      }),
      validatorHandlerMiddleware
  ];
};


export const validateLoadingOffer = () => {
  return [
    check("adId")
      .notEmpty()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل الاعلان الخاص بالتوصيله",
          en: "enter advertise Id",
        })
      ),
    check("price")
      .notEmpty()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل سعر الوصول",
          en: "enter price",
        })
      ),
      checkExact([], {
        message: returnValidationMessageToClient({
          en: "Sorry, you are trying to enter fields that are not required",
          ar: "لقد قمت بادخال حقول غير مطلوبة",
        }),
      }),
      validatorHandlerMiddleware
  ];
};


export const acceptLoadingOfferValidation = () => {
  return [
    check("notificationId")
      .notEmpty()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل الاشعار",
          en: "enter notification Id",
        })
      ),
    check("adId")
      .notEmpty()
      .withMessage(
        returnValidationMessageToClient({
          ar: "ادخل الاعلان الخاص السيارة",
          en: "enter loading advertise Id",
        })
      ),
      checkExact([], {
        message: returnValidationMessageToClient({
          en: "Sorry, you are trying to enter fields that are not required",
          ar: "لقد قمت بادخال حقول غير مطلوبة",
        }),
      }),
      validatorHandlerMiddleware
  ];
};

