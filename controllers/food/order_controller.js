import asyncWrapper from "../../utils/asyncWrapper.js";

// models
import user_model from "../../models/user_model.js";
import restaurant_model from "../../models/restaurant_model.js";
import food_model from "../../models/food_model.js";
import food_order_model from "../../models/food_order_model.js";
import rating_model from "../../models/rating_model.js";
import sub_category_model from "../../models/sub_category_model.js";
import notification_model from "../../models/notification_model.js";
import auth_model from "../../models/auth_model.js";

// controllers
import { sendNotifications } from "../notification_controller.js";
import { requestCashBack } from "../cash_back_controller.js";
import { foodCategoryId } from "../ride_controller.js";

// errors
import NotFoundError from "../../utils/types-errors/not-found.js";

import { competitionLogic } from "../../service/competition_logic.js";

/** ------------------------------------------------------
 * @desc get restaurant orders
 * @route /services/food/get-restaurant-orders
 * @method get
 * @access private
 * @data {}
 * @return {status, data}
 * ------------------------------------------------------ */
export const getRestaurantOrders = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers
  const { language } = req.headers;

  // -> 2) Get the page from the request query
  const { page } = req.query;

  // -> 3) Get the restaurant
  const restaurant = await restaurant_model
    .findOne({ user_id: req.user.id })
    .select("_id category_id");

  // -> 4) if the restaurant not found return 404
  if (!restaurant)
    throw new NotFoundError(
      language == "ar"
        ? "لا يوجد مطعم بهذا الاسم"
        : "No Restaurant with this name"
    );

  // -> 5) Get the orders
  const result = await food_order_model
    .find({ restaurant_id: restaurant.id })
    .sort({ createdAt: -1, _id: 1 })
    .skip(((page ?? 1) - 1) * 20)
    .limit(20);

  // -> 6) Get the category
  const category = await sub_category_model
    .findById(restaurant.category_id)
    .select("name_ar name_en");

  // -> 7) Get the total orders count
  const totalOrders = await food_order_model
    .find({ restaurant_id: restaurant.id })
    .count();

  // -> 8) Set the total orders count to the restaurant
  restaurant._doc.total = totalOrders;

  // -> 9) Get the ratings
  const ratings = await rating_model.find({
    category_id: category.id,
    ad_id: { $in: result.map((e) => e.id) },
  });

  // -> 10) Add the rating and sub category to the orders
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

  // -> 11) Send the response
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
 * @warning This route has a bug in the aggregation query and rating model
 * @return {status, data}
 * ------------------------------------------------------ */
export const getUserOrders = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers
  const { language } = req.headers;

  // -> 2) Get the page from the request query
  const { page } = req.query;

  // -> 3) Get the orders
  const result = await food_order_model
    .find({ user_id: req.user.id })
    .sort({ createdAt: -1, _id: 1 })
    .skip(((page ?? 1) - 1) * 20)
    .limit(20);

  // -> 4) if the orders not found return 404 without make any operations
  if (result.length == 0) return res.json({ status: true, data: result });

  const subCategoriesIds = [];
  const restaurantsIds = [];

  // -> 5) Get the sub categories and restaurants
  for (const order of result) {
    if (!subCategoriesIds.includes(order.category_id))
      subCategoriesIds.push(order.category_id);
    if (!restaurantsIds.includes(order.restaurant_id))
      restaurantsIds.push(order.restaurant_id);
  }
  // -> 6) Get the sub categories and restaurants
  const categories = await sub_category_model
    .find({ _id: { $in: subCategoriesIds } })
    .select("_id name_ar name_en");
  const restaurants = await restaurant_model.find({
    _id: { $in: restaurantsIds },
  });

  // -> 7) Get the ratings
  const ratings = await rating_model.find({
    user_rating_id: req.user.id,
    ad_id: { $in: result.map((e) => e.id) },
  });

  const totalOrders = await food_order_model.aggregate([
    {
      $match: {
        restaurant_id: { $in: restaurantsIds },
      },
    },
    { $group: { _id: "$restaurant_id", total: { $sum: 1 } } },
  ]);

  // -> 8) Add the rating and sub category to the orders
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

  // -> 9) Send the response
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
  // -> 1) Get the language from the request headers
  const { language } = req.headers;

  // -> 2) Get the restaurant and items from the request body
  const { restaurant, items } = req.body;

  // -> 3) Check if the restaurant exists
  const restaurantData = await restaurant_model
    .findOne({ restaurant_id: restaurant })
    .select("category_id user_id");

  if (!restaurantData)
    return next({
      status: 404,
      message:
        language == "ar"
          ? "لا يوجد مطعم بهذا الاسم"
          : "No Restaurant with this name",
    });

  // -> 4) Check if the items exists
  const itemsData = await food_model.find({
    restaurant_id: restaurant,
    _id: { $in: items },
    is_approved: true,
  });

  // -> 5) if the items not found return 404
  if (itemsData.length == 0)
    return next({
      status: 404,
      message:
        language == "ar" ? "لا يوجد طعام بهذا الاسم" : "No Food with this name",
    });

  // -> 6) Get the restaurant owner
  const restaurantOwner = await user_model
    .findById(restaurantData.user_id)
    .select("language user_id");

  // -> 7) if the restaurant owner not found return 404
  if (!restaurantOwner)
    return next({
      status: 404,
      message:
        language == "ar"
          ? "لا يوجد مالك لهذا المطعم"
          : "No Owner for this Restaurant",
    });

  // -> 8) Create the order
  await food_order_model.create({
    category_id: restaurantData.category_id,
    restaurant_id: restaurantData.user_id,
    user_id: req.user.id,
    items: itemsData.map((e) => e.name),
  });

  // -> 9) Create the notification requirements
  const titleAr = "طلب طعام جديد";
  const titleEn = "New Food Request";
  const bodyEn = `New Food Request Order , Deatils ( ${itemsData.map(
    (e) => `${e.name}\n`
  )} )`;
  const bodyAr = `طلب طعام جديد , التفاصيل ( ${itemsData.map(
    (e) => `${e.name}\n`
  )} )`;

  // -> 10) Check if the user already requested this restaurant
  restaurant_model
    .findOne({ restaurant_id: restaurant, requests: { $nin: [req.user.id] } })
    .then((r) => {
      if (r) {
        restaurant_model
          .updateOne(
            { restaurant_id: restaurant },
            { $addToSet: { requests: req.user.id } }
          )
          .exec();
        requestCashBack(req.user.id, language);
      }
    });

  // -> 11) Create the notification
  await notification_model.create({
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

  // -> 12) Send the notification
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

  // get category with category id
  const category = await sub_category_model.findById(
    restaurantData.category_id
  );
  // increase counter for food copemtition
  const result = await competitionLogic(req.user.id, category.parent);

  // -> 13) Send the response
  res.json({
    status: true,
  });
});

/** ------------------------------------------------------
 * @desc accept order
 * @route /services/food/rating-order
 * @method post
 * @access private
 * @data {field_one , field_two , field_three , comment , category_id , ad_id , user_id}
 * @warning This route has a bug in the aggregation query and rating model
 * @return {status}
 * ------------------------------------------------------ */
export const createRateOrder = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers
  const { language } = req.headers;

  // -> 2) Get the fields from the request body
  const {
    field_one,
    field_two,
    field_three,
    comment,
    category_id,
    ad_id,
    user_id,
  } = req.body;

  // -> 3) Check if the category exists
  const category = await sub_category_model
    .findById(category_id)
    .select("_id parent");

  if (!category)
    throw new NotFoundError(
      language == "ar" ? "لا يوجد فئة بهذا الاسم" : "No Category with this name"
    );

  // -> 4) Check if the category is from the food category
  if (category.parent != foodCategoryId)
    return next({
      status: 400,
      message:
        language == "ar"
          ? "هذا الاعلان ليس من فئة الطعام"
          : "This Ad is not from Food Category",
    });

  // -> 5) Create the rating
  await rating_model.updateOne(
    { user_rating_id: req.user.id, category_id, ad_id, user_id },
    { field_one, field_two, field_three, comment },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // -> 6) Get the rating
  let result = await rating_model.aggregate([
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

  // -> 7) Update the restaurant rating
  if (result && result.length > 0) {
    const total =
      (result[0].field_one + result[0].field_two + result[0].field_three) /
      (3 * result[0].count);
    restaurant_model
      .updateOne({ user_id }, { rating: parseFloat(total).toFixed(2) })
      .exec();
  } else restaurant_model.updateOne({ user_id }, { rating: 5.0 }).exec();

  // -> 8) Send the response
  res.json({ status: true });
});

/** ------------------------------------------------------
 * @desc delete order
 * @route /services/food/delete-rating
 * @method delete
 * @access private
 * @data {category_id , ad_id}
 * @return {status}
 * ------------------------------------------------------ */
export const deleteRateOrder = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers
  const { language } = req.headers;

  // -> 2) Get the order id from the request body
  const { category_id, ad_id } = req.body;

  const result = await rating_model.findOneAndDelete({
    user_rating_id: req.user.id,
    category_id,
    ad_id,
  });

  if (!result)
    throw new NotFoundError(
      language == "ar" ? "لا يوجد تقييم بهذا الاسم" : "No Rating with this name"
    );

  // -> 3) Get the rating and update the restaurant rating
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

  // -> 4) Send the response
  res.json({ status: true });
});
