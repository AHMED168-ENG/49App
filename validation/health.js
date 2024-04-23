import { validatorHandlerMiddleware } from '../middleware/validator-handler-middleware.js'
import doctor_model from '../models/doctor_model.js'
// USER MODEL
import user_model from '../models/user_model.js'
import sub_category_model from '../models/sub_category_model.js'
import { check, checkExact, header, param, query } from 'express-validator'
import main_category_model from '../models/main_category_model.js'

export function createDoctorValidation () {
  return [
    check('specialty')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال التخصص',
          en: 'Enter specialty'
        })
      ),
    check('location')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال الموقع',
          en: 'Enter location'
        })
      ),
    check('available_day')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال الايام المتاحة',
          en: 'Enter available days'
        })
      ),
    check('work_from')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال وقت الدخول',
          en: 'Enter work from'
        })
      ),
    check('work_to')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال وقت الخروج',
          en: 'Enter work to'
        })
      ),
    check('pictures')
      .isArray()
      .withMessage(
        JSON.stringify({
          ar: 'الصور يجب ان تكون علي الاقل 5 صور',
          en: 'pictures must be at least 5'
        })
      ),
    check('examination_price')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال السعر',
          en: 'Enter examination price'
        })
      ),
    check('waiting_time')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: ' قم بادخال الوقت',
          en: 'Enter waiting time'
        })
      ),
    check('category_id')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال القسم',
          en: 'Enter category'
        })
      ),
    // check if user found by req.user.id
    header('language')
      .custom(async (value, { req }) => {
        const user = await user_model.findOne({ _id: req.user.id })
        if (!user)
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا المستخدم غير موجود',
              en: 'this user not found'
            })
          )
        return true
      })
      .custom(async (value, { req }) => {
        const doctor = await doctor_model.findOne({ user_id: req.user.id })
        if (doctor)
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا الدكتور مسجل بالفعل',
              en: 'this doctor already registered'
            })
          )

        return true
      }),

    checkExact([], {
      message: 'Sorry, you are trying to enter fields that are not required'
    }),
    validatorHandlerMiddleware
  ]
}

export const updateDoctorValidation = () => {
  return [
    check('available_day')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال الايام المتاحة',
          en: 'Enter available days'
        })
      ),
    check('work_from')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال وقت الدخول',
          en: 'Enter work from'
        })
      ),
    check('work_to')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال وقت الخروج',
          en: 'Enter work to'
        })
      ),

    check('examination_price')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال السعر',
          en: 'Enter examination price'
        })
      ),
    check('waiting_time')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: ' قم بادخال الوقت',
          en: 'Enter waiting time'
        })
      ),
    header('language').custom(async (value, { req }) => {
      const doctor = await doctor_model.findOne({
        user_id: req.user.id,
        is_approved: true,
        is_active: true
      })
      if (!doctor)
        return Promise.reject(
          JSON.stringify({
            ar: 'هذا الدكتور غير موجود',
            en: 'this doctor not found'
          })
        )

      const subCategory = await sub_category_model.findById(doctor.category_id)
      if (!subCategory)
        return Promise.reject(
          JSON.stringify({
            ar: 'هذا التخصص غير موجود',
            en: ' this sub category not found'
          })
        )

      return true
    }),
    checkExact([], {
      message: 'Sorry, you are trying to enter fields that are not required'
    }),

    validatorHandlerMiddleware
  ]
}

// handle validation update doctor pictures

export const updateDocPictureValidation = () => {
  return [
    check('path')
      .trim()
      .notEmpty()
      .withMessage(JSON.stringify({ ar: 'ادخل مسار صورة', en: 'Enter path' })),
    checkExact([], {
      message: 'Sorry, you are trying to enter fields that are not required'
    }),
    validatorHandlerMiddleware
  ]
}

//handle validation get Doctors By Category

export const getDoctorsByCategoryValidation = () => {
  return [
    param('categoryId')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'المعرف ليسس صحيحا',
          en: 'Enter category id must be valid objectId'
        })
      )
      .custom(async (value, { req }) => {
        const subCategory = await sub_category_model.findById(value)
        if (!subCategory)
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا التخصص غير موجود',
              en: ' this sub category not found'
            })
          )
        const mainCategory = await main_category_model.findById(
          subCategory.parent
        )
        if (!mainCategory)
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا التخصص غير موجود',
              en: ' this sub category not found'
            })
          )
        return true
      })
  ]
}
export const getDoctorsByIdValidation = () => {
  return [
    param('id')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: ' قم بادخال معرف الدكتور ',
          en: 'Enter doctor id'
        })
      )
      .custom(async (value, { req }) => {
        const doctor = await doctor_model.findOne({ _id: value })
        if (!doctor)
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا الدكتور غير موجود',
              en: 'this doctor not found'
            })
          )
        const subCategory = await sub_category_model.findById(
          doctor.category_id
        )
        if (!subCategory)
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا التخصص غير موجود',
              en: ' this sub category not found'
            })
          )
        const mainCategory = await main_category_model.findById(
          subCategory.parent
        )
        if (!mainCategory)
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا القسم غير موجود',
              en: ' this main category not found'
            })
          )

        return true
      }),
    validatorHandlerMiddleware
  ]
}

// create Book validation

export const createBookValidation = () => {
  return [
    header('language')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال اللغة',
          en: 'Enter language'
        })
      ),
    check('id')
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال معرف الدكتور',
          en: 'Enter doctor id'
        })
      ),
    check('category_id')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال القسم',
          en: 'Enter category'
        })
      )
      .custom(async (value, { req }) => {
        const { id } = req.body
        const doctor = await doctor_model.findOne({
          _id: id,
          category_id: value,
          is_approved: true,
          is_active: true
        })
        if (!doctor)
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا الدكتور غير موجود',
              en: 'this doctor not found'
            })
          )
        const doctorUser = await user_model.findOne({ _id: doctor.user_id })
        if (!doctorUser)
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا الدكتور غير موجود',
              en: 'this doctor not found'
            })
          )
        const getSubCategory = await sub_category_model.findById(value)
        if (!getSubCategory) {
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا التخصص غير موجود',
              en: ' this sub category not found'
            })
          )
        }

        return true
      }),
    check('book_time')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال الوقت',
          en: 'Enter book time'
        })
      ),
    validatorHandlerMiddleware
  ]
}

// create get User Books validation

export const getUserBooksValidation = () => {
  return [
    header('language')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال اللغة',
          en: 'Enter language'
        })
      )
      .custom(async (value, { req }) => {
        const user = await user_model.findOne({ _id: req.user.id })
        const doctor = await doctor_model.findOne({ user_id: user._id })
        if (!doctor)
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا الدكتور غير موجود',
              en: 'this doctor not found'
            })
          )
      }),

    validatorHandlerMiddleware
  ]
}

export const getDoctorBooksValidation = () => {
  return [
    header('language')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال اللغة',
          en: 'Enter language'
        })
      )
      .custom(async (value, { req }) => {
        const user = await user_model.findOne({ _id: req.user.id })
        const doctor = await doctor_model.findOne({ user_id: user._id })
        if (!doctor)
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا الدكتور غير موجود',
              en: 'this doctor not found'
            })
          )
      }),

    validatorHandlerMiddleware
  ]
}

//  handle create Rating

export const createRatingValidation = () => {
  return [
    check('category_id')
      .trim()
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: 'معرف القسم ليس صحيحا',
          en: ' Enter category id must be valid objectId'
        })
      ),
    check('user_id')
      .trim()
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: 'معرف القسم ليس صحيحا',
          en: ' Enter category id must be valid objectId'
        })
      ),
    check('ad_id')
      .trim()
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: 'معرف القسم ليس صحيحا',
          en: ' Enter category id must be valid objectId'
        })
      ),
    validatorHandlerMiddleware
  ]
}
export const deleteRatingValidation = () => {
  return [
    header('language')
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: 'قم بادخال اللغة',
          en: 'Enter language'
        })
      ),
    check('category_id')
      .trim()
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: 'معرف القسم ليس صحيحا',
          en: ' Enter category id must be valid objectId'
        })
      ),
    check('ad_id')
      .trim()
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: 'معرف القسم ليس صحيحا',
          en: ' Enter category id must be valid objectId'
        })
      ),
    validatorHandlerMiddleware
  ]
}
