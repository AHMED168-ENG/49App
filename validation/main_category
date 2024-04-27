import { validatorHandlerMiddleware } from '../middleware/validator-handler-middleware.js'
import doctor_model from '../models/doctor_model.js'
// USER MODEL
import user_model from '../models/user_model.js'
import sub_category_model from '../models/sub_category_model.js'
import { check, checkExact, header, param, query } from 'express-validator'

//  validation of getSubCategoryById

export function  validationGetSubCategoryById () {
  return [
    param('id')
      .notEmpty()
      .isLength({ min: 24, max: 24 })
      .withMessage(
        JSON.stringify({ ar: 'معرف القسم ليس صحيحا', en: 'id is not valid' })
      )
      .custom(async (value, { req }) => {
        const subCategory = await sub_category_model.findById(value)
        console.log(subCategory)
        if (!subCategory) {
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا القسم غير موجود',
              en: 'this category not found'
            })
          )
        }
        return true
      }),
    validatorHandlerMiddleware
  ]
}

// validation of getSubCategoryByParent

export function validationGetSubCategoryByParent () {
  return [
    param('parentId')
      .notEmpty()
      .isLength({ min: 24, max: 24 })
      .withMessage(
        JSON.stringify({ ar: 'معرف القسم ليس صحيحا', en: 'id is not valid' })
      ),

    validatorHandlerMiddleware
  ]
}
