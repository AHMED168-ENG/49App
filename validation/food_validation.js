import {
  check,
  checkExact,
  validationResult,
  body,
  oneOf,
} from "express-validator";
import { validatorHandlerMiddleware } from "../middleware/validator-handler-middleware.js";
import { returnValidationMessageToClient } from "../utils/return-validation-message-to-client.js";

// @data {category_id, name, location, work_from, work_to, available_day, pictures}
const validationRegisterRestaurant = [
  body("category_id")
    .notEmpty()
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        en: "category id is required",
        ar: "معرف الفئة مطلوب",
      })
    ),
  body("name")
    .notEmpty()
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        en: "name is required",
        ar: "الاسم مطلوب",
      })
    ),
  body("location")
    .notEmpty()
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        en: "location is required",
        ar: "الموقع مطلوب",
      })
    ),
  body("work_from")
    .notEmpty()
    .isNumeric()
    .withMessage(
      returnValidationMessageToClient({
        en: "work start time is required",
        ar: "وقت بدء العمل مطلوب",
      })
    ),
  body("work_to")
    .notEmpty()
    .isNumeric()
    .withMessage(
      returnValidationMessageToClient({
        en: "work end time is required",
        ar: "وقت نهاية العمل مطلوب",
      })
    ),
  body("available_day")
    .notEmpty()
    .isArray()
    .withMessage(
      returnValidationMessageToClient({
        en: "available days is required",
        ar: "أيام العمل مطلوبة",
      })
    ),
  body("pictures")
    .notEmpty()
    .isArray()
    .withMessage(
      returnValidationMessageToClient({
        en: "pictures is required",
        ar: "الصور مطلوبة",
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

// @data {name, desc, price, picture}
const validationAddRestaurantItem = [
  body("name")
    .notEmpty()
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        en: "name is required",
        ar: "الاسم مطلوب",
      })
    ),
  body("desc")
    .notEmpty()
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        en: "description is required",
        ar: "الوصف مطلوب",
      })
    ),
  body("price")
    .notEmpty()
    .isNumeric()
    .withMessage(
      returnValidationMessageToClient({
        en: "price is required",
        ar: "السعر مطلوب",
      })
    ),
  body("picture")
    .notEmpty()
    .isString()
    .withMessage(
      returnValidationMessageToClient({
        en: "picture is required",
        ar: "الصورة مطلوبة",
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

// @data {name, location, work_from, work_to, available_day, pictures}
const validationUpdateRestaurant = [
  oneOf(
    [
      check("name").notEmpty().isString(),
      check("location").notEmpty().isString(),
      check("work_from").notEmpty().isNumeric(),
      check("work_to").notEmpty().isNumeric(),
      check("available_day").notEmpty().isArray(),
      check("pictures").notEmpty().isArray(),
    ],
    {
      message: returnValidationMessageToClient({
        en: "enter at least one field",
        ar: "ادخل حقل واحد على الأقل",
      }),
    }
  ),
  validatorHandlerMiddleware,
];

// @data {name, desc, price, picture}
const validationUpdateRestaurantItem = [
  oneOf(
    [
      check("name").notEmpty().isString(),
      check("desc").notEmpty().isString(),
      check("price").notEmpty().isNumeric(),
      check("picture").notEmpty().isString(),
    ],
    {
      message: returnValidationMessageToClient({
        en: "enter at least one field",
        ar: "ادخل حقل واحد على الأقل",
      }),
    }
  ),
  validatorHandlerMiddleware,
];

// @data {restaurant, items}
const validationCreateOrder = [
  body("restaurant")
    .notEmpty()
    .isMongoId()
    .withMessage(
      returnValidationMessageToClient({
        en: "restaurant id is required",
        ar: "معرف المطعم مطلوب",
      })
    ),
  body("items")
    .notEmpty()
    .isArray()
    .withMessage(
      returnValidationMessageToClient({
        en: "items is required",
        ar: "العناصر مطلوبة",
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



//* @data {comment , category_id , ad_id , user_id}
const validationCreateRateOrder = [
  body("comment")
    .notEmpty()
    .isString()
    .isLength({ min: 3, max: 100 })
    .withMessage(
      returnValidationMessageToClient({
        en: "comment is required",
        ar: "التعليق مطلوب",
      })
    ),
  body("category_id")
    .notEmpty()
    .isMongoId()
    .withMessage(
      returnValidationMessageToClient({
        en: "category id is required",
        ar: "معرف الفئة مطلوب",
      })
    ),
  body("ad_id")
    .notEmpty()
    .isMongoId()
    .withMessage(
      returnValidationMessageToClient({
        en: "ad id is required",
        ar: "معرف الإعلان مطلوب",
      })
    ),
  body("user_id")
    .notEmpty()
    .isMongoId()
    .withMessage(
      returnValidationMessageToClient({
        en: "user id is required",
        ar: "معرف المستخدم مطلوب",
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

//{category_id , ad_id}
const validationDeleteRateOrder = [
  body("category_id")
    .notEmpty()
    .isMongoId()
    .withMessage(
      returnValidationMessageToClient({
        en: "category id is required",
        ar: "معرف الفئة مطلوب",
      })
    ),
  body("ad_id")
    .notEmpty()
    .isMongoId()
    .withMessage(
      returnValidationMessageToClient({
        en: "ad id is required",
        ar: "معرف الإعلان مطلوب",
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

/**
 * @deprecated
 */
export const validate = (req, res, next) => {
  const language = req.language;
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = {};
  errors.array().forEach((err) => {
    extractedErrors[err.param] = err.msg[language]; // return the error message in the language of the request
  });

  return res.status(422).json({
    errors: extractedErrors,
  });
};

export {
  validationRegisterRestaurant,
  validationAddRestaurantItem,
  validationUpdateRestaurant,
  validationUpdateRestaurantItem,
  validationCreateOrder,
  validationCreateRateOrder,
  validationDeleteRateOrder,
};
