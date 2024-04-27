import express from 'express'
import favorite_model from '../../models/favorite_model.js'
import main_category_model from '../../models/main_category_model.js'
import sub_category_model from '../../models/sub_category_model.js'
import dynamic_ad_model from '../../models/dynamic_ad_model.js'
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
//gat all main category controller
export const getMainCategories = async (req, res, next) => {
  try {
    // extract user id from token
    const { id } = req.user
    // extract language from headers
    const { language } = req.headers
    // get all main category and sort by index
    const allMainCategory = await main_category_model
      .find({ is_hidden: false })
      .sort('index')
    // save all main category id in array   to handle search
    const mainIds = allMainCategory.map(e => e.id)
    // set favorites to handle search
    var favorites = []
    // check if user is logged in
    if (id) {
      // get all favorite ads of user in favorite model
      favorites = await favorite_model
        .find({ user_id: id, type: 1, ad_id: { $in: mainIds } })
        .select('ad_id')
        .distinct('ad_id')
    }
    // get total  ads of each services and count them in array
    const totals = await getLengthOfServices()
    for (var e of allMainCategory) {
      // check if main category is favorite or not
      e._doc.is_favorite = favorites.includes(e.id)
      e._doc.total = 0
      // set total to each main category
      if (e.id == rideCategoryId) {
        e._doc.total = totals[0] + totals[5] + totals[6]
      } else if (e.id == loadingCategoryId) {
        e._doc.total = totals[1]
      } else if (e.id == foodCategoryId) {
        e._doc.total = totals[2]
      } else if (e.id == healthCategoryId) {
        e._doc.total = totals[3]
      } else {
        // set dynamic ads total if main category is dynamic
        for (var count of totals[4]) {
          if (e.id == count._id) {
            e._doc.total = count.total
            break
          }
        }
      }
      // set main category name in arabic or english
      if (language == 'ar') {
        e._doc.name = e.name_ar
      } else {
        e._doc.name = e.name_en
      }
      // delete name_ar and name_en from main category before return
      delete e._doc.name_ar
      delete e._doc.name_en
    }
    res.json({
      status: true,
      data: allMainCategory
    })
  } catch (e) {
    next(e)
  }
}

// get sub category by parent id controller
export const getSubCategoryByParent = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers
    const { user } = req
    // extract parent id from params
    const { parentId } = req.params

    const subCategory = await sub_category_model
      .find({ parent: parentId, is_hidden: false })
      .sort('index')

    var favorites = []
    if (user) {
      favorites = await favorite_model
        .find({
          user_id: user.id,
          type: 2,
          ad_id: { $in: subCategory.map(e => e.id) }
        })
        .select('ad_id')
        .distinct('ad_id')
    }
    // get total  ads of each sub category
    var counts = await getTotalOfSubCategory(parentId)
    // add come with me and pick me ads count in counts array
    if (parentId == rideCategoryId) {
      const other = await Promise.all([
        come_with_me_ride_model.find({}).count(),
        pick_me_ride_model.find({}).count()
      ])
      counts.push(
        {
          _id: comeWithYouCategoryId,
          total: other[0]
        },
        {
          _id: pickMeCategoryId,
          total: other[1]
        }
      )
    }
    // set sub category name in arabic or english
    subCategory.forEach(e => {
      e._doc.is_favorite = favorites.includes(e.id)
      e._doc.total = 0

      for (var count of counts) {
        if (e.id == count._id) {
          e._doc.total = count.total
          break
        }
      }
      if (language == 'ar') {
        e._doc.name = e.name_ar
      } else {
        e._doc.name = e.name_en
      }
      // delete name_ar and name_en from sub category before return
      delete e._doc.name_ar
      delete e._doc.name_en
    })

    res.json({
      status: true,
      data: subCategory
    })
  } catch (e) {
    next(e)
  }
}
// get sub category by id controller
export const getSubCategoriesById = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers
    // extract sub category id from params
    const { id } = req.params
    //     check if sub category exist or not
    const subCategory = await sub_category_model.findById(id)
    // set sub category name in arabic or english
    subCategory._doc.name =
      language == 'ar' ? subCategory._doc.name_ar : subCategory._doc.name_en
    // set total of dynamic sub category
    subCategory._doc.total = await dynamic_ad_model
      .find({ sub_category_id: id })
      .count()
    subCategory._doc.is_favorite = false
    //
    if (req.user) {
      subCategory._doc.is_favorite =
        (await favorite_model
          .findOne({ ad_id: id })
          .select('ad_id')
          .distinct('ad_id')) != null
    }
    res.json({
      status: true,
      data: subCategory
    })
  } catch (e) {
    next(e)
  }
}

//************************** HELPER FUNCTIONS OF CATEGORIES CONTROLLER***********************************  */

const getLengthOfServices = async () => {
  const totals = await Promise.all([
    rider_model.find({}).count().exec(),
    loading_model.find({}).count().exec(),
    restaurant_model.find({}).count().exec(),
    doctor_model.find({}).count().exec(),
    dynamic_ad_model
      .aggregate([{ $group: { _id: '$main_category_id', total: { $sum: 1 } } }])
      .exec(),
    come_with_me_ride_model.find({}).count().exec(),
    pick_me_ride_model.find({}).count().exec()
  ])

  return totals
}

/** helper functions of getSubCategoryByParent controller         */
// get total  ads of each sub category
const getTotalOfSubCategory = async parentId => {
  var counts = await (parentId == rideCategoryId
    ? rider_model.aggregate([
        { $group: { _id: '$category_id', total: { $sum: 1 } } }
      ])
    : parentId == loadingCategoryId
    ? loading_model.aggregate([
        { $group: { _id: '$category_id', total: { $sum: 1 } } }
      ])
    : parentId == foodCategoryId
    ? restaurant_model.aggregate([
        { $group: { _id: '$category_id', total: { $sum: 1 } } }
      ])
    : parentId == healthCategoryId
    ? doctor_model.aggregate([
        { $group: { _id: '$category_id', total: { $sum: 1 } } }
      ])
    : dynamic_ad_model.aggregate([
        {
          $match: { main_category_id: parentId }
        },
        { $group: { _id: '$sub_category_id', total: { $sum: 1 } } }
      ]))
  return counts
}
