
import favorite_model from '../../models/favorite_model.js'
import main_category_model from '../../models/main_category_model.js'
import dynamic_ad_model from '../../models/dynamic_ad_model.js'
import dynamic_prop_model from '../../models/dynamic_prop_model.js'
import rider_model from '../../models/rider_model.js'
import loading_model from '../../models/loading_model.js'

import {
  comeWithYouCategoryId,
  foodCategoryId,
  healthCategoryId,
  loadingCategoryId,
  pickMeCategoryId,
  rideCategoryId
} from '../../controllers/ride_controller.js'
import restaurant_model from '../../models/restaurant_model.js'
import doctor_model from '../../models/doctor_model.js'
import come_with_me_ride_model from '../../models/come_with_me_ride_model.js'
import pick_me_ride_model from '../../models/pick_me_ride_model.js'

// main category favorite controller
export const getFavoriteMainCategory = async (req, res, next) => {
  // return res.json({
  //   status: true,
  // })
  try {
    // extract language from headers
    const { language } = req.headers
    // extract user id from token
    const { id } = req.user
    // get all favorite main category of user in favorite model
    const favorites = await getUserFavCategory(id, 1)

    // get all data of favorite main category
    const favoriteIds = favorites.map(e => e)

    const categoryData = await getCategoryData(main_category_model, favoriteIds)


    // get total count of each main category.
    const counts = await dynamic_ad_model.aggregate([
      { $group: { _id: '$main_category_id', total: { $sum: 1 } } }
    ])

    // set favorite to each main category
    for (const e of categoryData) {
      e._doc.is_favorite = true
      e._doc.total = 0
      // filter category by main category id and set total to each main category
      if (e.id == rideCategoryId) {
        const data = await Promise.all([
          rider_model.find({}).count(),
          come_with_me_ride_model.find({}).count(),
          pick_me_ride_model.find({}).count()
        ])

        e._doc.total = data[0] + data[1] + data[2]
      } else if (e.id == loadingCategoryId) {
        e._doc.total = await loading_model.find({}).count()
      } else if (e.id == foodCategoryId) {
        e._doc.total = await restaurant_model.find({}).count()
      } else if (e.id == healthCategoryId) {
        e._doc.total = await doctor_model.find({}).count()
      } else {
        for (var count of counts) {
          if (e.id == count._id) {
            e._doc.total = count.total
            break
          }
        }
      }

      // set name to each main category based on language
      if (language == 'ar') {
        e._doc.name = e.name_ar
      } else {
        e._doc.name = e.name_en
      }
      // delete name_ar and name_en from each main category object before sending it to client
      delete e._doc.name_ar
      delete e._doc.name_en
    }

    res.json({
      status: true,
      data: categoryData
    })
  } catch (e) {
    next(e)
  }
}

// create favorite main category

export const createFavoriteMainCategory = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers
    // extract user id from token
    const userId = req.user.id
    // extract main category id from token
    const { id } = req.body
    // check if main category exist or not
    const mainCategory = await main_category_model.findById(id)

    // add favorite main category to favorite model for user in favorite model with type 1
    // type 1 means main category
    await favorite_model.updateOne(
      { user_id: userId, ad_id: id, type: 1 },
      { user_id: userId, ad_id: id, type: 1 },
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

// delete favorite main category controller
export const deleteFavoriteManCategory = async (req, res, next) => {
  // extract user id from token
  const userId = req.user.id
  // extract main category id from params
  const { id } = req.params

  try {
    // delete favorite main category from favorite model for user
    await favorite_model.deleteOne({
      user_id: userId,
      ad_id: id,
      type: 1
    })
    // send response to client with status true
    res.json({
      status: true
    })
  } catch (e) {
    next(e)
  }
}

// get sub category favorite controller

























//************HELPER FUNCTION OF MAIN CATEGORY FAVORITE CONTROLLER***************** */

const getUserFavCategory = async (id, type) => {
  console.log(id, type);
  return await favorite_model
    .find({
      user_id: id,
      type: type
    })
   .sort({ createdAt: -1, _id: 1 })
    .select('ad_id')
   .distinct('ad_id')
}

export const getCategoryData = async (model, favoriteIds) => {
  return await model.find({
    _id: { $in: favoriteIds },
    is_hidden: false
  })
}


// create promise array to get total of each sub category

export const getTotalOfSubCategory = async (promise, subCategories, categoryData) => {
  let [
    isRideAdded,
    isComeWithMeAdded,
    isPickMeAdded,
    isLoadingAdded,
    isFoodAdded,
    isHealthAdded
  ] = [false, false, false, false, false, false]

  for (const favorite of categoryData) {
    if (!subCategories.includes(favorite.id)) subCategories.push(favorite.id)

    if (
      favorite.parent == rideCategoryId &&
      favorite.id != comeWithYouCategoryId &&
      favorite.id != pickMeCategoryId &&
      isRideAdded == false
    ) {
      isRideAdded = true
      promise.push(
        rider_model.aggregate([
          { $group: { _id: '$category_id', total: { $sum: 1 } } }
        ])
      )
    }
    if (favorite.id == comeWithYouCategoryId && isComeWithMeAdded == false) {
      isComeWithMeAdded = true
      promise.push(
        come_with_me_ride_model.aggregate([
          { $group: { _id: comeWithYouCategoryId, total: { $sum: 1 } } }
        ])
      )
    }
    if (favorite.id == pickMeCategoryId && isPickMeAdded == false) {
      isPickMeAdded = true
      promise.push(
        pick_me_ride_model.aggregate([
          { $group: { _id: pickMeCategoryId, total: { $sum: 1 } } }
        ])
      )
    }
    if (favorite.parent == loadingCategoryId && isLoadingAdded == false) {
      isLoadingAdded = true
      promise.push(
        loading_model.aggregate([
          { $group: { _id: '$category_id', total: { $sum: 1 } } }
        ])
      )
    }
    if (favorite.parent == foodCategoryId && isFoodAdded == false) {
      isFoodAdded = true
      promise.push(
        restaurant_model.aggregate([
          { $group: { _id: '$category_id', total: { $sum: 1 } } }
        ])
      )
    }
    if (favorite.parent == healthCategoryId && isHealthAdded == false) {
      isHealthAdded = true
      promise.push(
        doctor_model.aggregate([
          { $group: { _id: '$category_id', total: { $sum: 1 } } }
        ])
      )
    }
  }
}
