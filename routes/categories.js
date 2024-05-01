import express from 'express'

import {
  getMainCategories,
  getSubCategoriesById,
  getSubCategoryByParent
} from '../controllers/categories/categories_controller.js'
import { isAuthenticated } from '../middleware/is-authenticated.js'
import { validationGetSubCategoryByParent } from '../validation/main_category.js'
import { validationGetSubCategoryById } from '../validation/main_category.js'

const router = express.Router()
/** ------------------------------------------------------
*@route  get all main categories
*@route path  /categories/main
*@method  GET
*@access private  get all main categories
*@return(statue : true, data : main categories)
 /**  ------------------------------------------------------ */
router.get('/main', isAuthenticated, getMainCategories)
/** ------------------------------------------------------
*@route  get all sub categories by parent id
*@route path  /categories/sub/:parentId
*@method  GET
*@access private  get all sub categories by parent id
*@return(statue : true, data : sub categories)
 /**  ------------------------------------------------------ */
router.get(
  '/sub/:parentId',
  isAuthenticated,
  validationGetSubCategoryByParent(),
  getSubCategoryByParent
)
/** ------------------------------------------------------
*@route  get sub category by id
*@route path  /categories/sub-by-id/:id
*@method  GET
*@access private  get sub category by id
*@return(statue : true, data : sub category)
 /**  ------------------------------------------------------ */
router.get(
  '/sub-by-id/:id',
  isAuthenticated,
  validationGetSubCategoryById(),
  getSubCategoriesById
)


export default router
