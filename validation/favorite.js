import { validatorHandlerMiddleware } from '../middleware/validator-handler-middleware.js'
import doctor_model from '../models/doctor_model.js'
// USER MODEL
import { check, header, param, query } from 'express-validator'
import main_category_model from '../models/main_category_model.js'
import sub_category_model from '../models/sub_category_model.js'
import dynamic_ad_model from '../models/dynamic_ad_model.js'
export const createFavoriteMainCategoryValidation = () => {
  return [
    check('id')
      .notEmpty()
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: 'معرف القسم ليس صحيحا',
          en: ' Enter category id must be valid objectId'
        })
      )
      .custom(async value => {
        const mainCategory = await main_category_model.findById(value)
        if (!mainCategory)
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا التخصص غير موجود',
              en: ' this sub category not found'
            })
          )
        return true
      }),
    validatorHandlerMiddleware
  ]
}

// deleteFavoriteManCategory validation

const deleteFavoriteManCategoryValidation = () => {
  return [
    param('id')
      .notEmpty()
      .isLength({ min: 24, max: 24 })
      .withMessage(
        JSON.stringify({
          ar: 'معرف القسم ليس صحيحا',
          en: ' Enter category id must be valid objectId'
        })
      )
      .custom(async value => {
        const mainCategory = await main_category_model.findById(value)
        if (!mainCategory) return Promise.reject(JSON.stringify({}))
      }),
    validatorHandlerMiddleware
  ]
}

export const createFavoriteSubCategoryValidation = () => {
  return [
    check('id')
      .notEmpty()
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: 'معرف القسم ليس صحيحا',
          en: ' Enter category id must be valid objectId'
        })
      )
      .custom(async value => {
        const subCategory = await sub_category_model.findById(value)
        if (!subCategory)
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا التخصص غير موجود',
              en: ' this sub category not found'
            })
          )
        return true
      }),
    validatorHandlerMiddleware
  ]
}
export const createFavoriteAddValidation = () => {
  return [
    check('id')
      .notEmpty()
      .isMongoId()
      .withMessage(
        JSON.stringify({
          ar: 'معرف الاعلان ليس صحيحا',
          en: ' Enter ad id must be valid objectId'
        })
      )
      .custom(async value => {
        const ad = await dynamic_ad_model.findById(value)
        if (!ad)
          return Promise.reject(
            JSON.stringify({
              ar: 'هذا الاعلان غير موجود',
              en: ' this sub ad not found'
            })
          )
        return true
      }),
    validatorHandlerMiddleware
  ]
}
