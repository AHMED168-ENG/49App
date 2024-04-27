import express from 'express'
import {
  createFavoriteMainCategory,
  deleteFavoriteManCategory,
  getFavoriteMainCategory
} from '../controllers/favorite/main_favorite_controller.js'
import { isAuthenticated } from '../middleware/is-authenticated.js'
import {
  createFavoriteAddValidation,
  createFavoriteMainCategoryValidation,
  createFavoriteSubCategoryValidation
} from '../validation/favorite.js'
import {
  createFavoriteSubCategory,
  deleteFavoriteSubCategory,
  getSubCategoryFavorite
} from '../controllers/favorite/sub_favorite_controller.js'
import {
  addFavoriteAdsController,
  getFavoriteAdsController,
  removeFavoriteAdsController
} from '../controllers/favorite/ads_favorite_controller.js'
const router = express.Router()

/** ------------------------------------------------------
*@route  get favorite main category
*@route path /favorites/main
*@method  GET
*@access private   get favorite main category
*@return(statue : true, data : categoryData )
 /**  ------------------------------------------------------ */
router.get('/main', isAuthenticated, getFavoriteMainCategory)

/** ------------------------------------------------------
 * @route  create favorite main category
 * @route path /favorites/main
 * @method  POST
 * @access private   create favorite main category
 * @return(statue : true)
  /**  ------------------------------------------------------ */
router.post(
  '/main',
  isAuthenticated,
  createFavoriteMainCategoryValidation(),
  createFavoriteMainCategory
)

/** ------------------------------------------------------
 * @route  delete favorite main category
 * @route path /favorites/main
 * @method  DELETE
 * @access private   delete favorite main category
 * @return(statue : true)
 * /**  ------------------------------------------------------ */
router.delete('/main/:id', isAuthenticated, deleteFavoriteManCategory)

/** ------------------------------------------------------
 * @route  get favorite sub category
 * @route path /favorites/sub
 * @method  GET
 * @access private   get favorite sub category
 * @return(statue : true, data : subCategoryData )
 * /**  ------------------------------------------------------ */

router.get('/sub', isAuthenticated, getSubCategoryFavorite)
/** ------------------------------------------------------
 * @route  create favorite sub category
 * @route path /favorites/sub
 * @method  POST
 * @access private   create favorite sub category
 * @return(statue : true)
 * /**  ------------------------------------------------------ */
router.post(
  '/sub',
  isAuthenticated,
  createFavoriteSubCategoryValidation(),
  createFavoriteSubCategory
)
/** ------------------------------------------------------
 * @route  delete favorite sub category
 * @route path /favorites/sub/:id
 * @method  DELETE
 * @access private   delete favorite sub category
 * @return(statue : true)
 * /**  ------------------------------------------------------ */
router.delete('/sub/:id', isAuthenticated, deleteFavoriteSubCategory)
/** ------------------------------------------------------
 * @route  get favorite ads
 * @route path /favorites/ad
 * @method  GET
 * @access private   get favorite ads
 * @return(statue : true, data : adsData )
 * /**  ------------------------------------------------------ */
router.get('/ad', isAuthenticated, getFavoriteAdsController)
/** ------------------------------------------------------
 * @route  add favorite ads
 * @route path /favorites/ad
 * @method  POST
 * @access private   add favorite ads
 * @return(statue : true)
 * /**  ------------------------------------------------------ */

router.post(
  '/ad',
  isAuthenticated,
  createFavoriteAddValidation(),
  addFavoriteAdsController
)
/** ------------------------------------------------------
 * @route  remove favorite ads
 * @route path /favorites/ad/:id
 * @method  DELETE
 * @access private   remove favorite ads
 * @return(statue : true)
 * /**  ------------------------------------------------------ */
router.delete('/ad/:id', isAuthenticated, removeFavoriteAdsController)
export default router
