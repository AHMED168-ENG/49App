import asyncWrapper from "../../utils/asyncWrapper.js";

import user_model from "../../models/user_model.js";
import restaurant_model from "../../models/restaurant_model.js";
import subscription_model from "../../models/subscription_model.js";
import food_model from "../../models/food_model.js";
import food_order_model from "../../models/food_order_model.js";
import rating_model from "../../models/rating_model.js";
import sub_category_model from "../../models/sub_category_model.js";
import notification_model from "../../models/notification_model.js";
import auth_model from "../../models/auth_model.js";
import { sendNotifications } from "../notification_controller.js";
import { requestCashBack } from "../cash_back_controller.js";
import { foodCategoryId } from "../ride_controller.js";

/** ------------------------------------------------------
 * @desc get restaurant orders
 * @route /services/food/get-restaurant-orders
 * @method get
 * @access private
 * @data {}
 * @return {status, data}
 * ------------------------------------------------------ */
export const getRestaurantOrders = asyncWrapper(async (req, res, next) => {
  const { language } = req.headers;

  const { page } = req.query;

  const restaurant = await restaurant_model
    .findOne({ user_id: req.user.id })
    .select("_id category_id");

  if (!restaurant) return next("Bad Request");

  const result = await food_order_model
    .find({ restaurant_id: restaurant.id })
    .sort({ createdAt: -1, _id: 1 })
    .skip(((page ?? 1) - 1) * 20)
    .limit(20);

  const category = await sub_category_model
    .findById(restaurant.category_id)
    .select("name_ar name_en");

  const totalOrders = await food_order_model
    .find({ restaurant_id: restaurant.id })
    .count();

  restaurant._doc.total = totalOrders;

  const ratings = await rating_model.find({
    category_id: category.id,
    ad_id: { $in: result.map((e) => e.id) },
  });

  for (const order of result) {
    for (const rating of ratings) {
      if (order.id == rating.ad_id) {
        order._doc.rating = rating;
        break;
      }
    }

    order._doc.sub_category =
      language == "ar" ? category.name_ar : category.name_en;
  }

  res.json({
    status: true,
    data: result,
  });
});

/** ------------------------------------------------------
 * @desc get user orders
 * @route /services/food/get-user-orders
 * @method get
 * @access private
 * @data {}
 * @return {status, data}
 * ------------------------------------------------------ */
export const getUserOrders = asyncWrapper(async (req, res, next) => {
  const { language } = req.headers;

  const { page } = req.query;

  const result = await food_order_model
    .find({ user_id: req.user.id })
    .sort({ createdAt: -1, _id: 1 })
    .skip(((page ?? 1) - 1) * 20)
    .limit(20);

  const subCategoriesIds = [];
  const restaurantsIds = [];

  for (const order of result) {
    if (!subCategoriesIds.includes(order.category_id))
      subCategoriesIds.push(order.category_id);
    if (!restaurantsIds.includes(order.restaurant_id))
      restaurantsIds.push(order.restaurant_id);
  }
  const categories = await sub_category_model
    .find({ _id: { $in: subCategoriesIds } })
    .select("_id name_ar name_en");
  const restaurants = await restaurant_model.find({
    _id: { $in: restaurantsIds },
  });

  const ratings = await rating_model.find({
    user_rating_id: req.user.id,
    ad_id: { $in: result.map((e) => e.id) },
  });

  const totalOrders = await food_order_model.aggregate([
    {
      $match: {
        restaurant_id: { $in: result.map((e) => e.restaurant_id) },
      },
    },
    { $group: { _id: "$restaurant_id", total: { $sum: 1 } } },
  ]);

  for (const order of result) {
    for (const rating of ratings) {
      if (order.id == rating.ad_id) {
        order._doc.rating = rating;
        break;
      }
    }
    for (const category of categories) {
      if (order.category_id == category.id) {
        order._doc.sub_category =
          language == "ar" ? category.name_ar : category.name_en;
        break;
      }
    }
    for (const restaurant of restaurants) {
      if (order.restaurant_id == restaurant.id) {
        order._doc.restaurant_info = restaurant;
        order._doc.restaurant_info._doc.total = 0;
        for (const total of totalOrders) {
          if (total._id == restaurant.id) {
            order._doc.restaurant_info._doc.total = total.total;
            break;
          }
        }
        break;
      }
    }
  }

  res.json({
    status: true,
    data: result,
  });
});

/** ------------------------------------------------------
 * @desc create order
 * @route /services/food/make-order
 * @method post
 * @access private
 * @data {restaurant, items}
 * @return {status}
 * ------------------------------------------------------ */
export const createOrder = asyncWrapper(async (req, res, next) => {
  const { language } = req.headers;

  const { restaurant, items } = req.body;

  if (!restaurant || !items) return next("Bad Request");

  const user = await user_model.findById(req.user.id);

  if (!user) return next({ status: 404, message: "Not Found" });

  const itemsData = await food_model.find({
    restaurant_id: restaurant,
    _id: { $in: items },
  });

  if (itemsData.length == 0) return next("Bad Request");

  const restaurantData = await restaurant_model
    .findOne({ user_id: restaurant })
    .select("category_id user_id");
  const restaurantOwner = await user_model
    .findById(restaurantData.user_id)
    .select("language user_id");

  if (!restaurantOwner || !restaurantData)
    return next({ status: 404, message: "Not Found" });

  const order = new food_order_model({
    category_id: restaurantData.category_id,
    restaurant_id: restaurantData.user_id,
    user_id: req.user.id,
    items: itemsData.map((e) => e.name),
  });

  order.save();

  const titleAr = "طلب طعام جديد";
  const titleEn = "New Food Request";
  const bodyEn = `New Food Request Order , Deatils ( ${itemsData.map(
    (e) => `${e.name}\n`
  )} )`;
  const bodyAr = `طلب طعام جديد , التفاصيل ( ${itemsData.map(
    (e) => `${e.name}\n`
  )} )`;

  restaurant_model
    .findOne({ user_id: restaurant, requests: { $nin: [req.user.id] } })
    .then((r) => {
      if (r) {
        restaurant_model
          .updateOne(
            { user_id: restaurant },
            { $addToSet: { requests: req.user.id } }
          )
          .exec();
        requestCashBack(req.user.id, language);
      }
    });

  const notificationObject = new notification_model({
    receiver_id: restaurantData.user_id,
    user_id: req.user.id,
    sub_category_id: itemsData[0].category_id,
    tab: 2,
    text_ar: bodyAr,
    text_en: bodyEn,
    direction: restaurantData.user_id,
    main_category_id: foodCategoryId,
    type: 10007,
    ad_owner: restaurantData.user_id,
    is_accepted: true,
  });

  notificationObject.save();

  auth_model
    .find({ user_id: restaurantData.user_id })
    .distinct("fcm")
    .then((fcm) => {
      sendNotifications(
        fcm,
        restaurantOwner.language == "ar" ? titleAr : titleEn,
        restaurantOwner.language == "ar" ? bodyAr : bodyEn,
        10007
      );
    });

  res.json({
    status: true,
  });
});


/** ------------------------------------------------------
 * @desc accept order
 * @route /services/food/rating-order
 * @method post
 * @access private
 * @data {order_id}
 * @return {status}
 * ------------------------------------------------------ */
export const createRateOrder = asyncWrapper(async (req, res, next) => {
  const { language } = req.headers;

  const {
    field_one,
    field_two,
    field_three,
    comment,
    category_id,
    ad_id,
    user_id,
  } = req.body;

  if (!category_id || !ad_id || !user_id) return next("Bad Request");

  const category = await sub_category_model
    .findById(category_id)
    .select("_id parent");

  if (category && category.parent == foodCategoryId) {
    if (comment.length > 100)
      return next({
        stauts: 400,
        message:
          language == "ar"
            ? "أقصى عدد حروف للتعليق 100 حرف"
            : "Max Comment length is 100 Letters",
      });

    await rating_model.updateOne(
      { user_rating_id: req.user.id, category_id, ad_id, user_id },
      { field_one, field_two, field_three, comment },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    var result = await rating_model.aggregate([
      { $match: { user_id, category_id } },
      {
        $group: {
          _id: null,
          field_one: { $sum: "$field_one" },
          field_two: { $sum: "$field_two" },
          field_three: { $sum: "$field_three" },
          count: { $sum: 1 },
        },
      },
    ]);
    if (result && result.length > 0) {
      const total =
        (result[0].field_one + result[0].field_two + result[0].field_three) /
        (3 * result[0].count);
      restaurant_model
        .updateOne({ user_id }, { rating: parseFloat(total).toFixed(2) })
        .exec();
    } else restaurant_model.updateOne({ user_id }, { rating: 5.0 }).exec();

    res.json({ status: true });
  } else return next("Bad Request");
});

/** ------------------------------------------------------
 * @desc delete order
 * @route /services/food/delete-order
 * @method delete
 * @access private
 * @data {order_id}
 * @return {status}
 * ------------------------------------------------------ */
export const deleteRateOrder = asyncWrapper(async (req, res, next) => {
  const { category_id, ad_id } = req.body;
  const { language } = req.headers;

  if (!category_id || !ad_id) return next("Bad Request");

  const result = await rating_model.findOneAndDelete({
    user_rating_id: req.user.id,
    category_id,
    ad_id,
  });

  if (!result)
    return next({
      status: 400,
      message:
        language == "ar"
          ? "لا يوجد تقييم لهذا الاعلان"
          : "No Rating for this Ad",
    });

  if (result) {
    if (result.length > 0) {
      const total =
        (result[0].field_one + result[0].field_two + result[0].field_three) /
        (3 * result[0].count);
      restaurant_model
        .updateOne(
          { user_id: result.user_id },
          { rating: parseFloat(total).toFixed(2) }
        )
        .exec();
    } else
      restaurant_model
        .updateOne({ user_id: result.user_id }, { rating: 5.0 })
        .exec();
  }

  res.json({ status: true });
});
