import express from 'express'
import {
  createDoctor,
  deleteDoctor,
  getDoctorById,
  getDoctorsByCategory,
  updateDocPicture,
  updateDoctor
} from '../../controllers/health/doctor_controller.js'
import {
  createBook,
  getDoctorBooks
} from '../../controllers/health/book_controller.js'
import {
  createRating,
  deleteRating
} from '../../controllers/health/rating_controller.js'
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
  updateDoctorValidation
} from '../../validation/health.js'
import { isAuthenticated } from '../../middleware/is-authenticated.js'

// create express router
const router = express.Router()

/** ------------------------------------------------------
*@route create doctor
*@route path /services/health/register
*@method  POST
*@access private create doctor
*@return(statue : true)
 /**  ------------------------------------------------------ */
router.post(
  '/register',
  isAuthenticated,
  createDoctorValidation(),
  createDoctor
)
/** ------------------------------------------------------
*@route delete doctor
*@route path /services/health/delete-registration
*@method  DELETE
*@access private delete doctor
*@return(statue : true)
 /**  ------------------------------------------------------ */

// DO NOT HAVE VALIDATION
router.delete('/delete-registration', isAuthenticated, deleteDoctor)

/** ------------------------------------------------------
*@route update doctor
*@route path /services/health/update-info
*@method  PUT
*@access private update doctor
*@return(statue : true)
 /**  ------------------------------------------------------ */
router.put(
  '/update-info',
  isAuthenticated,
  updateDoctorValidation(),
  updateDoctor
)

/** ------------------------------------------------------
*@route update doctor picture
*@route path /services/health/update-picture
*@method  post
*@access private update doctor picture
*@return(statue : true)
 /**  ------------------------------------------------------ */

router.post(
  '/update-picture',
  isAuthenticated,
  updateDocPictureValidation(),
  updateDocPicture
)

/** ------------------------------------------------------
*@route get doctor books
*@route path /services/health/update-picture
*@method  get
*@access private  get doctor books
*@return(statue : true, data : books)
 /**  ------------------------------------------------------ */

router.get(
  '/get-doctor-books',
  isAuthenticated,
  getDoctorBooksValidation(),
  getDoctorBooks
)

//************************************************************************/
/** ------------------------------------------------------
*@route get doctor by category
*@route path /services/health//doctors/:categoryId
*@method  get
*@access private  get doctor by category
*@return(statue : true, data : doctors)
 /**  ------------------------------------------------------ */
router.get(
  '/doctors/:categoryId',
  isAuthenticated,
  getDoctorsByCategoryValidation(),
  getDoctorsByCategory
)

//************************************************************************/
/** ------------------------------------------------------
*@route  create book
*@route path /services/health/book
*@method  post
*@access private  create book
*@return(statue : true,)
 /**  ------------------------------------------------------ */
router.post(
  '/book',
  isAuthenticated,
  createBookValidation(),

  createBook
)

/** ------------------------------------------------------
*@route get user books
*@route path /services/health/get-user-books
*@method  get
*@access private  get user books
*@return(statue : true, data : books)
 /**  ------------------------------------------------------ */
router.get(
  '/get-user-books',
  isAuthenticated,
  getUserBooksValidation(),
  getDoctorBooks
)

/** ------------------------------------------------------
*@route get delete rating
*@route path /services/health/delete-rating
*@method  DELETE
*@access private  delete rating
*@return(statue : true)
 /**  ------------------------------------------------------ */
router.delete(
  '/delete-rating',
  isAuthenticated,
  deleteRatingValidation(),
  deleteRating
)

/** ------------------------------------------------------
*@route  create rating
*@route path /services/health/update-picture
*@method  POST
*@access private  delete rating
*@return(statue : true)
 /**  ------------------------------------------------------ */
router.post('/rating', isAuthenticated, createRatingValidation(), createRating)

/** ------------------------------------------------------
*@route get doctor by id
*@route path /services/health/get-doctor/:id
*@method  GET
*@access private  get doctor by id
*@return(statue : true, data : doctor)
 /**  ------------------------------------------------------ */
router.get(
  '/get-doctor/:id',
  isAuthenticated,
  getDoctorsByIdValidation(),
  getDoctorById
)

export default router
