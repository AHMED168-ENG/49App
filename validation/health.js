import doctor_model from "../models/doctor_model.js";
import { check, param, query } from "express-validator";

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
    //    check("pictures").notEmpty().withMessage(JSON.stringify({
    //        ar: "قم بادخال الصور",
    //        en: "Enter pictures"
    //    })),
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
}

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

export const updateDocPictureValidation  = () => {
  return [
    check("path")
    .trim()
    .isMongoId()
    .withMessage(JSON.stringify({ ar: "ادخل صورة", en: "Enter path" }))
  ]
  
};



//handle validation get Doctors By Category

export const getDoctorsByCategoryValidation = () => {
  return [
    param("categoryId")
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar:"المعرف ليسس صحيحا",
          en: "Enter category id must be valid objectId",
        })
      ),
  ]
}
export const getDoctorsByIdValidation = () => {
  return [
    param("id")
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: " قم بادخال معرف الدكتور ",
          en: "Enter doctor id",
        })
      ),
  ]
}