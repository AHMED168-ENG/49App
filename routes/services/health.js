import express from "express";
import { verifyToken } from "../../helper.js";
import {
  createDoctor,
  deleteDoctor,
  getDoctorById,
  getDoctorsByCategory,
  updateDocPicture,
  updateDoctor,
} from "../../controllers/health/doctor_controller.js";
import {
  createBook,
  getDoctorBooks,
} from "../../controllers/health/book_controller.js";
import {
  createRating,
  deleteRating,
} from "../../controllers/health/rating_controller.js";
import {
  createBookValidation,
  createDoctorValidation,
  createRatingValidation,
  deleteRatingValidation,
  getDoctorBooksValidation,
  getDoctorsByCategoryValidation,
  getDoctorsByIdValidation,
  getUserBooksValidation,
  updateDocPictureValidation,
  updateDoctorValidation,
} from "../../validation/health.js";
import handel_validation_errors from "../../middleware/handelBodyError.js";

// create express router
const router = express.Router();

/** ------------------------------------------------------
*@route create doctor
*@route path /services/health/register
*@method  POST
*@access private create doctor
 /**  ------------------------------------------------------ */
router.post(
  "/register",
  verifyToken,
  createDoctorValidation(),
  handel_validation_errors,
  createDoctor
);

/** ------------------------------------------------------
*@route delete doctor
*@route path /services/health/delete-registration
*@method  DELETE
*@access private delete doctor
 /**  ------------------------------------------------------ */

// DO NOT HAVE VALIDATION
router.delete("/delete-registration", verifyToken, deleteDoctor);

/** ------------------------------------------------------
*@route update doctor
*@route path /services/health/update-info
*@method  PUT
*@access private update doctor
 /**  ------------------------------------------------------ */
router.put(
  "/update-info",
  verifyToken,
  updateDoctorValidation(),
  handel_validation_errors,
  updateDoctor
);

/** ------------------------------------------------------
*@route update doctor picture
*@route path /services/health/update-picture
*@method  post
*@access private update doctor picture
 /**  ------------------------------------------------------ */

router.post(
  "/update-picture",
  verifyToken,
  updateDocPictureValidation(),
  handel_validation_errors,
  updateDocPicture
);

/** ------------------------------------------------------
*@route get doctor books
*@route path /services/health/update-picture
*@method  get
*@access private  get doctor books
 /**  ------------------------------------------------------ */

router.get(
  "/get-doctor-books",
  verifyToken,
  getDoctorBooksValidation(),
  handel_validation_errors,
  getDoctorBooks
);

//************************************************************************/
/** ------------------------------------------------------
*@route get doctor by category
*@route path /services/health//doctors/:categoryId
*@method  get
*@access private  get doctor by category
 /**  ------------------------------------------------------ */
router.get(
  "/doctors/:categoryId",
  verifyToken,
  getDoctorsByCategoryValidation(),
  handel_validation_errors,
  getDoctorsByCategory
);

//************************************************************************/
/** ------------------------------------------------------
*@route  create book
*@route path /services/health/book
*@method  post
*@access private  create book
 /**  ------------------------------------------------------ */
router.post(
  "/book",
  verifyToken,
  createBookValidation(),
  handel_validation_errors,
  createBook
);

/** ------------------------------------------------------
*@route get user books
*@route path /services/health/get-user-books
*@method  get
*@access private  get user books
 /**  ------------------------------------------------------ */
router.get(
  "/get-user-books",
  verifyToken,
  getUserBooksValidation(),
  handel_validation_errors,
  getDoctorBooks
);

/** ------------------------------------------------------
*@route get delete rating
*@route path /services/health/delete-rating
*@method  DELETE
*@access private  delete rating
 /**  ------------------------------------------------------ */
router.delete(
  "/delete-rating",
  verifyToken,
  deleteRatingValidation(),
  handel_validation_errors,
  deleteRating
);

/** ------------------------------------------------------
*@route  create rating
*@route path /services/health/update-picture
*@method  POST
*@access private  delete rating
 /**  ------------------------------------------------------ */
router.post(
  "/rating",
  verifyToken,
  createRatingValidation(),
  handel_validation_errors,
  createRating
);

/** ------------------------------------------------------
*@route get doctor by id
*@route path /services/health/get-doctor/:id
*@method  GET
*@access private  get doctor by id
 /**  ------------------------------------------------------ */
router.get(
  "/get-doctor/:id",
  verifyToken,
  getDoctorsByIdValidation(),
  handel_validation_errors,
  getDoctorById
);

export default router;
