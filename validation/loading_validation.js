import { check , checkExact ,body } from "express-validator";
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

export const validationAddRating = () => {
  return [
    body("field_one")
    .isNumeric()
    .withMessage(
      returnValidationMessageToClient({
        ar: "ادخل التقييم",
        en: "enter rating",
      })
    ),
    check("field_two")
    .isNumeric()
    .withMessage(
      returnValidationMessageToClient({
        ar: "ادخل التقييم",
        en: "enter rating",
      })
    ),
    check("field_three")
    .isNumeric()
    .withMessage(
      returnValidationMessageToClient({
        ar: "يجب ان يكون رقم ",
        en: "please enter number",
      })
    ),  
    check("comment")
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        ar: "ادخل التعليق",
        en: "enter comment",
      })
    ),
    check("category_id")
    .notEmpty()
    .withMessage(
      returnValidationMessageToClient({
        ar: "ادخل الفئة",
        en: "enter category",
      })
    ),
    check("ad_id")
    .notEmpty()
    .withMessage(
      returnValidationMessageToClient({
        ar: "ادخل الاعلان",
        en: "enter advertise",
      })
    ),
    check("user_id")
    .notEmpty()
    .withMessage(
      returnValidationMessageToClient({ 
        ar: "ادخل السائق",
        en: "enter user",
      })
    ),
    validatorHandlerMiddleware
  ];
}

export const validationDeleteRating = () => {
  return [
    check("category_id")
    .notEmpty()
    .withMessage(
      returnValidationMessageToClient({
        ar: "ادخل الفئة",
        en: "enter category",
      })
    ),
    check("ad_id")
    .notEmpty()
    .withMessage(
      returnValidationMessageToClient({
        ar: "ادخل الاعلان",
        en: "enter advertise",
      })
    ),
    validatorHandlerMiddleware
  ]

}