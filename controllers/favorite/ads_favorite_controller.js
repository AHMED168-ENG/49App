import favorite_model from '../../models/favorite_model.js'
import sub_category_model from '../../models/sub_category_model.js'
import dynamic_ad_model from '../../models/dynamic_ad_model.js'
import dynamic_prop_model from '../../models/dynamic_prop_model.js'
import subscription_model from '../../models/subscription_model.js'
import { dynamicAdKeys } from '../../helper.js'

// get favorite ads controller
export const getFavoriteAdsController = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers
    // extract page from query
    const { page } = req.query
    // get favorite ads from favorite model for user in favorite model
    const favorites = await favorite_model
      .find({
        user_id: req.user.id,
        type: 3
      })
      .sort({ createdAt: -1, _id: 1 })
      .skip(((page ?? 1) - 1) * 20)
      .limit(20)
      .select('ad_id sub_category_id')
    // get data of favorite ads from dynamic ad model
    const ads = await dynamic_ad_model
      .find({
        _id: { $in: favorites.map(e => e.ad_id) },
        is_active: true,
        is_approved: true
      })
      .select(dynamicAdKeys)
    // set subCategoriesIds to handle search
    const subCategoriesIds = []
    // set usersIds to handle search
    const usersIds = [req.user.id]
    // push all ids of favorite ads to userIds
    ads.forEach(e => {
      if (!usersIds.includes(e.user_id)) usersIds.push(e.user_id)
    })
    // push all sub categories id of favorite ads to subCategoriesIds

    favorites.forEach(e => {
      if (!subCategoriesIds.includes(e.sub_category_id))
        subCategoriesIds.push(e.sub_category_id)
    })
    // get data of sub categories from sub category model
    const subCategories = await sub_category_model
      .find({ _id: { $in: subCategoriesIds } })
      .select('_id name_ar name_en parent')
    // get data of dynamic props from dynamic prop model
    const props = await dynamic_prop_model.find({
      sub_category_id: { $in: subCategoriesIds }
    })
    // get data of subscriptions from subscription model
    const subscriptions = await subscription_model
      .find({
        sub_category_id: { $in: subCategoriesIds },
        user_id: { $in: usersIds }
      })
      .select('sub_category_id user_id')
    // set is_favorite and is_subscription
    ads.forEach(ad => {
      ad._doc.is_favorite = true
      ad._doc.is_subscription = false
      //check ads is_subscription or not
      for (const subscription of subscriptions) {
        if (
          subscription.sub_category_id == ad.sub_category_id &&
          (ad.user_id == subscription.user_id ||
            subscription.user_id == req.user.id)
        ) {
          ad._doc.is_subscription = true
          break
        }
      }
      // get sub category name and sub category parent
      for (const subCategory of subCategories) {
        if (ad.sub_category_id == subCategory.id) {
          ad._doc.sub_category_name =
            language == 'ar' ? subCategory.name_ar : subCategory.name_en
          ad._doc.sub_category_parent = subCategory.parent
          break
        }
      }
      // get prop name and selections
      ad.props.forEach(adProp => {
        for (const prop of props) {
          if (prop.id == adProp.id) {
            adProp._id = adProp.id
            adProp.name = language == 'ar' ? prop.name_ar : prop.name_en
            adProp.selections = prop.selections
            delete adProp.id
            break
          }
        }
      })
    })

    // send response to client with status true and data of ads
    res.json({
      status: true,
      data: ads
    })
  } catch (e) {
    next(e)
  }
}

// add favorite ads controller
export const addFavoriteAdsController = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers
    // extract id from body
    const { id } = req.body
    //get ad by id from dynamic ad model
    const ad = await dynamic_ad_model.findById(id)
    // VALIDATION IF AD IS NOT EXIST
    // if (!ad)
    //   return next({
    //     status: 404,
    //     message: language == 'ar' ? 'الاعلان غير موجود' : 'The Ad is Not Exist'
    //   })
    // add favorite ads to favorite model for user in favorite model
    await favorite_model.updateOne(
      {
        user_id: req.user.id,
        ad_id: id,
        type: 3,
        sub_category_id: ad.sub_category_id
      },
      {
        user_id: req.user.id,
        ad_id: id,
        type: 3,
        sub_category_id: ad.sub_category_id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    // send response to client with status true`
    res.json({
      status: true
    })
  } catch (e) {
    next(e)
  }
}

// remove favorite ads controller
export const removeFavoriteAdsController = async (req, res, next) => {
  // extract id from params
  const { id } = req.params
  try {
    // delete favorite ads from favorite model for user in favorite model
    // type 3 means ads
    await favorite_model.deleteOne({
      user_id: req.user.id,
      ad_id: id,
      type: 3
    })
    //send response to client with status true`
    res.json({
      status: true
    })
  } catch (e) {
    next(e)
  }
}
