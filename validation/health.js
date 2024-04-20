import doctor_model from "../models/doctor_model.js";
import { check, checkExact, header, param, query } from "express-validator";

export function createDoctorValidation() {
  return [
    check("specialty")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال التخصص",
          en: "Enter specialty",
        })
      ),
    check("location")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال الموقع",
          en: "Enter location",
        })
      ),
    check("available_day")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال الايام المتاحة",
          en: "Enter available days",
        })
      ),
    check("work_from")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال وقت الدخول",
          en: "Enter work from",
        })
      ),
    check("work_to")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال وقت الخروج",
          en: "Enter work to",
        })
      ),
    check("pictures")
      .isArray().withMessage(
        JSON.stringify({
          ar: "الصور يجب ان تكون علي الاقل 5 صور",
          en: "pictures must be at least 5",
        })
      ),
    check("examination_price")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال السعر",
          en: "Enter examination price",
        })
      ),
    check("waiting_time")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: " قم بادخال الوقت",
          en: "Enter waiting time",
        })
      ),
    check("category_id")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال القسم",
          en: "Enter category",
        }).isL
      ),
      checkExact([], {
        message :"Sorry, you are trying to enter fields that are not required"
      })
  ];
}
// Sorry, you are trying to enter fields that are not required
// عذرًا، أنت تحاول إدخال حقول غير مطلوب
// handle validation update  doctor

export const updateDoctorValidation = () => {
  return [
    check("available_day")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال الايام المتاحة",
          en: "Enter available days",
        })
      ),
    check("work_from")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال وقت الدخول",
          en: "Enter work from",
        })
      ),
    check("work_to")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال وقت الخروج",
          en: "Enter work to",
        })
      ),

    check("examination_price")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال السعر",
          en: "Enter examination price",
        })
      ),
    check("waiting_time")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: " قم بادخال الوقت",
          en: "Enter waiting time",
        })
      ),
  ];
};

// handle validation update doctor pictures

export const updateDocPictureValidation = () => {
  return [
    check("path")
      .trim()
      .isMongoId()
      .withMessage(JSON.stringify({ ar: "ادخل صورة", en: "Enter path" })),
  ];
};

//handle validation get Doctors By Category

export const getDoctorsByCategoryValidation = () => {
  return [
    param("categoryId")
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: "المعرف ليسس صحيحا",
          en: "Enter category id must be valid objectId",
        })
      ),
  ];
};
export const getDoctorsByIdValidation = () => {
  return [
    param("id")
      .isEmpty()
      .withMessage(
        JSON.stringify({
          ar: " قم بادخال معرف الدكتور ",
          en: "Enter doctor id",
        })
      ),
  ];

};

// create Book validation

export const createBookValidation = () => {
  return [
    header("language")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال اللغة",
          en: "Enter language",
        })
      ),
    check("id")
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال معرف الدكتور",
          en: "Enter doctor id",
        })
      ),
    check("category_id")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال القسم",
          en: "Enter category",
        })
      ),
    check("book_time")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال الوقت",
          en: "Enter book time",
        })
      ),
  ];
};

// create get User Books validation

export const getUserBooksValidation = () => {
  return [
    header("language")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال اللغة",
          en: "Enter language",
        })
      ),
    param("page")
      .trim()
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال الصفحة",
          en: "Enter page",
        })
      )
      .isNumeric()
      .withMessage(
        JSON.stringify({
          ar: "الصفحة يجب ان تكون رقم",
          en: " page must be number",
        })
      ),
  ];
};

export const getDoctorBooksValidation = () => {
  return [
    header("language")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال اللغة",
          en: "Enter language",
        })
      ),
    param("page")
      .trim()
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال الصفحة",
          en: "Enter page",
        })
      )
      .isNumeric()
      .withMessage(
        JSON.stringify({
          ar: "الصفحة يجب ان تكون رقم",
          en: " page must be number",
        })
      ),
  ];
};

//  handle create Rating

export const createRatingValidation = () => {
  return [
    check("category_id")
      .trim()
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: "معرف القسم ليس صحيحا",
          en: " Enter category id must be valid objectId",
        })
      ),
    check("user_id")
      .trim()
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: "معرف القسم ليس صحيحا",
          en: " Enter category id must be valid objectId",
        })
      ),
    check("ad_id")
      .trim()
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: "معرف القسم ليس صحيحا",
          en: " Enter category id must be valid objectId",
        })
      ),
  ];
};
export const deleteRatingValidation = () => {
  return [
    header("language")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "قم بادخال اللغة",
          en: "Enter language",
        })
      ),
    check("category_id")
      .trim()
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: "معرف القسم ليس صحيحا",
          en: " Enter category id must be valid objectId",
        })
      ),
    check("ad_id")
      .trim()
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: "معرف القسم ليس صحيحا",
          en: " Enter category id must be valid objectId",
        })
      ),
  ];
};
