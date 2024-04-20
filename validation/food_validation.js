import { check, validationResult } from "express-validator";

// @data {category_id, name, location, work_from, work_to, available_day, pictures}
export const validationRegisterRestaurant = () => {
  return [
    check("category_id").notEmpty().withMessage({
      ar: "ادخل القسم",
      en: "enter category",
    }),
    check("name").notEmpty().withMessage({
      ar: "ادخل اسم المطعم",
      en: "enter restaurant name",
    }),
    check("location").notEmpty().withMessage({
      ar: "ادخل موقع المطعم",
      en: "enter restaurant location",
    }),
    check("work_from").notEmpty().withMessage({
      ar: "ادخل وقت البداية",
      en: "enter start time",
    }),
    check("work_to").notEmpty().withMessage({
      ar: "ادخل وقت الانتهاء",
      en: "enter end time",
    }),
    check("available_day").notEmpty().withMessage({
      ar: "ادخل الايام المتاحة",
      en: "enter available days",
    }),
    check("pictures").notEmpty().withMessage({
      ar: "ادخل صور المطعم",
      en: "enter restaurant pictures",
    }),
  ];
};

// @data {name, desc, price, picture}
export const validationAddRestaurantItem = () => {
  return [
    check("name").notEmpty().withMessage({
      ar: "ادخل اسم الطعام",
      en: "enter food name",
    }),
    check("desc").notEmpty().withMessage({
      ar: "ادخل وصف الطعام",
      en: "enter food description",
    }),
    check("price").notEmpty().withMessage({
      ar: "ادخل السعر",
      en: "enter price",
    }),
    check("picture")
      .custom((value, { req, res, next }) => {
        // Check if the picture field is not an array
        if (Array.isArray(value)) {
          return Promise.reject({
            ar: "لا يسمح بمصفوفة من الصور",
            en: "Array of pictures is not allowed",
          });
        }
        return true;
      })
      .notEmpty()
      .withMessage({
        ar: "ادخل صورة الطعام",
        en: "enter food picture",
      }),
  ];
};

// @data {name, location, work_from, work_to, available_day, pictures}
export const validationUpdateRestaurant = () => {
  return [
    check("name").custom((value, { req, res, next }) => {
      const { name, location, work_from, work_to, available_day, pictures } =
        req.body;
      // Check if the name field is not an array
      if (
        name ||
        location ||
        work_from ||
        work_to ||
        available_day ||
        pictures
      ) {
        return true; // At least one field is not empty
      } else {
        return Promise.reject({
          ar: "ادخل حقل واحد على الأقل",
          en: "enter at least one field",
        });
      }
    }),
  ];
};

// @data {name, desc, price, picture}
export const validationUpdateRestaurantItem = () => {
  return [
    check("name").custom((value, { req, res, next }) => {
      const { name, desc, price, picture } = req.body;
      // Check if the name field is not an array
      if (name || desc || price || picture) {
        return true; // At least one field is not empty
      } else {
        return Promise.reject({
          ar: "ادخل حقل واحد على الأقل",
          en: "enter at least one field",
        });
      }
    }),
  ];
};

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
