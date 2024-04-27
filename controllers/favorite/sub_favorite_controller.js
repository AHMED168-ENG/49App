import favorite_model from '../../models/favorite_model.js'
import sub_category_model from '../../models/sub_category_model.js'
import dynamic_ad_model from '../../models/dynamic_ad_model.js'
import {
  getCategoryData,
  getTotalOfSubCategory
} from './main_favorite_controller.js'

export const getSubCategoryFavorite = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers
    //  extract page from query
    const { page } = req.query
    // get all favorite sub category of user in favorite model
    const favorites = await getFavoriteSubCategory(req.user.id, page)

    const favoriteIds = favorites.map(e => e.ad_id)

    const categoryData = await getCategoryData(sub_category_model, favoriteIds)

    // set favorite to each sub category
    // create subCategory array to store sub favorite.id
    let subCategories = []
    // create promise array to get total of each sub category
    let promise = []
    // create promise array to get total of each sub category

    await getTotalOfSubCategory(promise, subCategories, categoryData)
    // check if sub category grater than
    if (subCategories.length > 0)
      promise.push(
        dynamic_ad_model.aggregate([
          { $group: { _id: '$sub_category_id', total: { $sum: 1 } } }
        ])
      )

    // set total of all sub category IN allCounts
    const allCounts = await Promise.all(promise)
    //
    let counts = []
    // push all items in counts array
    for (const item of allCounts) {
      for (const singleItem of item) {
        counts.push(singleItem)
      }
    }
    //
    categoryData.forEach(e => {
      e._doc.is_favorite = true
      e._doc.total = 0
      //
      for (var count of counts) {
        if (e.id == count._id) {
          e._doc.total = count.total
          break
        }
      }

      // set name to each sub category based on language
      if (language == 'ar') {
        e._doc.name = e.name_ar
      } else {
        e._doc.name = e.name_en
      }
      // delete name_ar and name_en from each sub category object before sending it to client

      delete e._doc.name_ar
      delete e._doc.name_en
    })
    // send response to client with status true and data
    res.json({
      status: true,
      data: categoryData
    })
  } catch (e) {
    next(e)
  }
}

// create favorite sub category controller

export const createFavoriteSubCategory = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers
    //     extract sub category id from body
    const { id } = req.body
    // validation
    if (!id) return next('Bad Request')
    // get sub category by id
    const subCategory = await sub_category_model.findById(id)

    if (!subCategory)
      return next({
        status: 404,
        message:
          language == 'ar' ? 'القسم غير موجود' : 'The Category is Not Exist'
      })
    // create favorite sub category in favorite model for user
    await favorite_model.updateOne(
      { user_id: req.user.id, ad_id: id, type: 2 },
      { user_id: req.user.id, ad_id: id, type: 2 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    // send response to client with status true
    res.json({
      status: true
    })
  } catch (e) {
    next(e)
  }
}

export const deleteFavoriteSubCategory = async (req, res, next) => {
  // extract id from params
  const { id } = req.params

  try {
    // delete favorite sub category from favorite model for user
    await favorite_model.deleteOne({
      user_id: req.user.id,
      ad_id: id,
      type: 2
    })
    // send response to client with status true
    res.json({
      status: true
    })
  } catch (e) {
    next(e)
  }
}

/*************************************HELPER FUNCTIONS OF  CONTROLLERS **** **************************************                       */

// get user favorite sub category
const getFavoriteSubCategory = async (id, page) => {
  return await favorite_model
    .find({
      user_id: id,
      type: 2
    })
    .sort({ createdAt: -1, _id: 1 })
    .skip(((page ?? 1) - 1) * 20)
    .limit(20)
    .select('ad_id')
}
