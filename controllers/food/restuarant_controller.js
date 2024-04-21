import asyncWrapper from "../../utils/asyncWrapper.js";

import user_model from "../../models/user_model.js";
import restaurant_model from "../../models/restaurant_model.js";
import subscription_model from "../../models/subscription_model.js";
import food_model from "../../models/food_model.js";
import food_order_model from "../../models/food_order_model.js";
import rating_model from "../../models/rating_model.js";
import sub_category_model from "../../models/sub_category_model.js";
import main_category_model from "../../models/main_category_model.js";

const filterFieldsForUpdate = (body, fields) => {
  const updateObject = {};
  fields.forEach((field) => {
    if (body[field]) updateObject[field] = body[field];
  });
  return updateObject;
};

/** ------------------------------------------------------
 * @desc create restaurant
 * @route /services/food/register
 * @method post
 * @access private
 * @data {category_id, name, location, work_from, work_to, available_day, pictures}
 * @return {status}
 * ------------------------------------------------------ */
export const createRestuarant = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers
  const { language } = req.headers || "en";

  const user = await user_model.findById(req.user.id);

  // -> 2) Extract the data from the request body
  const {
    category_id,
    name,
    location,
    work_from,
    work_to,
    available_day,
    pictures,
  } = req.body;

  // -> 3) Check if the user is already registered as a restaurant
  const result = await restaurant_model.findOne({ user_id: req.user.id });

  // -> 4) If the user is already registered as a restaurant, return an error
  if (result)
    return next({
      status: 400,
      message:
        language == "ar"
          ? "لقد قمت بالتسجيل من قبل"
          : "You already Registered Before",
    });

  // -> 5) Check if the user has a premium subscription
  const subscription = await subscription_model.findOne({
    user_id: req.user.id,
    sub_category_id: category_id,
    is_premium: true,
  });

  // -> 6) Create a new restaurant object and save it
  await restaurant_model.create({
    user_id: req.user.id,
    pictures,
    category_id,
    name,
    location,
    work_from,
    work_to,
    available_day: available_day.map((e) => parseInt(e)),
    country_code: user.country_code,
    is_premium: subscription != null,
  });

  console.log("user", user);

  // -> 7) Update the user model to set the is_restaurant field to true
  await user_model
    .updateOne({ _id: req.user.id }, { is_restaurant: true })
    .exec();

  // -> 8) Return the response
  res.json({
    status: true,
  });
});

/** ------------------------------------------------------
 * @desc update restaurant info
 * @route /services/food/update_restaurant_info
 * @method put
 * @access private
 * @data {category_id, name, location, work_from, work_to, available_day, pictures}
 * @Warning at least one field is required
 * @return {status , new data}
 * ------------------------------------------------------ */
export const updateRestaurantInfo = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers
  const { language } = req.headers;

  // -> 2) Check if the user is already registered as a restaurant
  const result = await restaurant_model.findOne({ user_id: req.user.id });

  // -> 3) If the user is already registered as a restaurant, return an error
  if (!result)
    return next({
      status: 400,
      message:
        language == "ar"
          ? "لم تقم بالتسجيل كمطعم بعد"
          : "You didn't Register as a Restaurant Yet",
    });

  // -> 4) Check if the user has a premium subscription
  const subscription = await subscription_model.findOne({
    user_id: req.user.id,
    sub_category_id: result.category_id,
    is_premium: true,
  });

  // -> 5) Check if the user has a premium subscription
  const fields = Object.keys(req.body);

  // -> 5) Update the restaurant object
  const updateObject = filterFieldsForUpdate(req.body, fields);

  subscription && (updateObject.is_premium = true);

  // -> 6) Update the restaurant object
  const updatedRestaurant = await restaurant_model.findOneAndUpdate(
    { user_id: req.user.id },
    updateObject,
    { new: true }
  );

  // -> 7) Return the response
  res.json({
    status: true,
    data: updatedRestaurant,
  });

  // -> 8) Update the user model to set the is_restaurant field to true
  await user_model
    .updateOne({ _id: req.user.id }, { is_restaurant: true })
    .exec();
});

/** ------------------------------------------------------
 * @desc delete restaurant
 * @route /services/food/delete-registration
 * @method delete
 * @access private
 * @data {}
 * @return {status}
 * ------------------------------------------------------ */
export const deleteRestuarant = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers
  const { language } = req.headers || "en";
  // -> 2) Check if the user is already registered as a restaurant
  const restaurantDeleteResult = await restaurant_model.findOneAndDelete({
    user_id: req.user.id,
  });

  // -> 3) Return an error if the user is not registered as a restaurant
  if (!restaurantDeleteResult)
    return next({
      status: 404,
      message:
        language == "ar" ? "المطعم غير موجود" : "The Restaurant is Not Exist",
    });

  // -> 4) If the restaurant is deleted, delete the related data
  if (restaurantDeleteResult) {
    // Delete related data in parallel
    await Promise.all([
      food_model.deleteMany({ restaurant_id: req.user.id }),
      food_order_model.deleteMany({ restaurant_id: req.user.id }),
      rating_model.deleteMany({
        user_id: req.user.id,
        category_id: restaurantDeleteResult.category_id,
      }),
    ]);

    // Update the user model to set the is_restaurant field to false
    await user_model
      .updateOne({ _id: req.user.id }, { $set: { is_restaurant: false } })
      .exec();
  }

  // -> 5) Return the response
  res.json({
    status: true,
  });
});

/** ------------------------------------------------------
 * @desc get restaurant by id
 * @route /services/food/restaurants/:id
 * @method get
 * @access private
 * @data {}
 * @return {status, data}
 * ------------------------------------------------------ */
export const getRestaurantById = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers
  const { language } = req.headers || "en";

  // -> 2) Find the restaurant by id
  const result = await restaurant_model
    .findById(req.params.id)
    .select(
      "category_id user_id pictures name location work_from work_to available_day rating is_approved is_active is_premium country_code"
    );

  // -> 3) If the restaurant is not found, return an error
  if (!result)
    return next({
      status: 404,
      message:
        language == "ar" ? "المطعم غير موجود" : "The Restaurant is Not Exist",
    });

  // -> 4) Find the sub category by id
  const subCategory = await sub_category_model
    .findById(result.category_id)
    .select("name_ar name_en parent");

  // -> 5) If the sub category is not found, return an error
  if (!subCategory)
    return next({
      status: 404,
      message:
        language == "ar"
          ? "القسم الفرعي غير موجود"
          : "Sub Category is Not Exist",
    });

  // -> 6) Find the main category by id
  const mainCategory = await main_category_model
    .findById(subCategory.parent)
    .select("name_ar name_en");

  // -> 7) If the main category is not found, return an error
  if (!mainCategory)
    return next({
      status: 404,
      message:
        language == "ar"
          ? "القسم الرئيسي غير موجود"
          : "Main Category is Not Exist",
    });

  // -> 8) Find the subscriptions
  const subscriptions = await subscription_model
    .find({
      sub_category_id: req.params.categoryId,
      user_id: { $in: [req.user.id, result.user_id] },
    })
    .distinct("user_id");

  // -> 9) Find the total orders
  const totalOrders = await food_order_model.aggregate([
    {
      $match: { restaurant_id: result.user_id },
    },
    { $group: { _id: "$restaurant_id", total: { $sum: 1 } } },
  ]);

  const now = new Date();

  result._doc.is_opened =
    result.available_day.includes(now.getDay()) &&
    now.getHours() >= result.work_from &&
    now.getHours() <= result.work_to;
  result._doc.is_subscription =
    subscriptions.includes(result.user_id) ||
    subscriptions.includes(req.user.id);

  result._doc.main_category_name =
    language == "ar" ? mainCategory.name_ar : mainCategory.name_en;

  result._doc.sub_category_name =
    language == "ar" ? subCategory.name_ar : subCategory.name_en;

  result._doc.total = 0;

  if (totalOrders.length > 0) {
    result._doc.total = totalOrders[0].total;
  }

  res.json({
    status: true,
    data: result,
  });
});

/** ------------------------------------------------------
 * @desc get restaurants by category
 * @route /services/food/restaurants/:categoryId
 * @method get
 * @access private
 * @data {}
 * @return {status, data}
 * ------------------------------------------------------ */
export const getRestaurantsCategory = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers 
  const { language } = req.headers || "en";

  const user = await user_model.findById(req.user.id);

  // -> 2) Get the page number from the query /*Required for pagination*/
  const { page } = req.query;

  // -> 3) Find the sub category by id
  const subCategory = await sub_category_model
    .findById(req.params.categoryId)
    .select("name_ar name_en parent");

  // -> 4) If the sub category is not found, return an error
  if (!subCategory)
    return next({
      status: 404,
      message:
        language == "ar"
          ? "القسم الفرعي غير موجود"
          : "Sub Category is Not Exist",
    });

  // -> 5) Find the main category by id
  const mainCategory = await main_category_model
    .findById(subCategory.parent)
    .select("name_ar name_en");

  // -> 6) If the main category is not found, return an error
  if (!mainCategory)
    return next({
      status: 404,
      message:
        language == "ar"
          ? "القسم الرئيسي غير موجود"
          : "Main Category is Not Exist",
    });

  // -> 7) Find the restaurants by category
  const result = await restaurant_model
    .find({
      country_code: user.country_code,
      category_id: req.params.categoryId,
      is_active: true,
      is_approved: true,
    })
    .sort({ createdAt: -1, _id: 1 })
    .skip(((page ?? 1) - 1) * 20)
    .limit(20)
    .select(
      "category_id user_id pictures name location work_from work_to available_day rating is_approved is_active is_premium country_code"
    );

  // -> 8) If the restaurants are not found, return an error
  const usersIds = [req.user.id];

  result.forEach((ad) => {
    if (!usersIds.includes(ad.user_id)) usersIds.push(ad.user_id);
  });

  // -> 9) Find the subscriptions
  const subscriptions = await subscription_model
    .find({
      sub_category_id: req.params.categoryId,
      user_id: { $in: usersIds },
    })
    .distinct("user_id");

  // -> 10) Find the total orders
  const totalOrders = await food_order_model.aggregate([
    {
      $match: {
        restaurant_id: { $in: usersIds },
      },
    },
    { $group: { _id: "$restaurant_id", total: { $sum: 1 } } },
  ]);

  const now = new Date();

  // -> 11) Update the result object
  result.forEach((item) => {
    item._doc.is_opened =
      item.available_day.includes(now.getDay()) &&
      now.getHours() >= item.work_from &&
      now.getHours() <= item.work_to;
    item._doc.is_subscription =
      subscriptions.includes(item.user_id) ||
      subscriptions.includes(req.user.id);

    item._doc.main_category_name =
      language == "ar" ? mainCategory.name_ar : mainCategory.name_en;
    item._doc.sub_category_name =
      language == "ar" ? subCategory.name_ar : subCategory.name_en;

    item._doc.total = 0;
    for (const total of totalOrders) {
      if (total._id == item.user_id) {
        item._doc.total = total.total;
        break;
      }
    }
  });

  // -> 12) Return the response
  res.json({
    status: true,
    data: result,
  });
});

/** ------------------------------------------------------
 * @desc add food
 * @route /services/food/add-food
 * @method post
 * @access private
 * @data {name, desc, price, picture}
 * @return {status, data}
 * ------------------------------------------------------ */
export const addRestaurantItem = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers
  const { language } = req.headers || "en";

  // -> 2) Extract the data from the request body
  const { name, desc, price, picture } = req.body;

  // -> 3) Check if the user is already registered as a restaurant
  const restaurant = await restaurant_model
    .findOne({ user_id: req.user.id, is_approved: true, is_active: true })
    .select("_id category_id");

  // -> 4) If the user is not registered as a restaurant, return an error
  if (!restaurant)
    return next({
      status: 404,
      message:
        language == "ar" ? "المطعم غير موجود" : "The Restaurant is Not Exist",
    });

  // -> 5) Create a new food object
  const result = await food_model.create({
    restaurant_id: restaurant.id,
    category_id: restaurant.category_id,
    name,
    desc,
    price,
    picture,
  });

  // -> 6) Return the response
  return res.json({
    status: true,
    data: result,
  });
});

/** ------------------------------------------------------
 * @desc update restaurant item
 * @route /services/food/update-info/:id
 * @method post
 * @access private
 * @data {name, desc, price, picture}
 * @Warning at least one field is required
 * @Warning Need to change a path to get id from params
 * @return {status, new data}
 * ------------------------------------------------------ */
export const updateRestaurantItem = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers
  const { language } = req.headers || "en";

  // -> 3) Check if the user is already registered as a restaurant
  const restaurant = await restaurant_model
    .findOne({ user_id: req.user.id, is_approved: true, is_active: true })
    .select("_id category_id");

  // -> 4) If the user is not registered as a restaurant, return an error
  if (!restaurant)
    return next({
      status: 404,
      message:
        language == "ar" ? "المطعم غير موجود" : "The Restaurant is Not Exist",
    });

  // -> 5) Extract the data from the request body
  const fields = Object.keys(req.body);

  // -> 6) Update the restaurant object
  const updateObject = filterFieldsForUpdate(req.body, fields);

  // -> 7) Create a new food object
  const result = await food_model.findOneAndUpdate(
    { _id: req.params.id, restaurant_id: restaurant.id },
    updateObject,
    { new: true }
  );

  //  -> 8) If the food is not found, return an error
  if (!result)
    return next({
      status: 404,
      message: language == "ar" ? "الطعام غير موجود" : "The Food is Not Exist",
    });

  // -> 9) Return the response
  return res.json({
    status: true,
    data: result,
  });
});

/** ------------------------------------------------------
 * @desc get foods
 * @route /services/food/food-items/:restaurantId
 * @method get
 * @access private
 * @data {}
 * @return {status, data}
 * ------------------------------------------------------ */
export const getRestaurantItems = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers
  const { language } = req.headers || "en";

  // -> 2) Find the restaurant by user id
  const restaurant = await restaurant_model
    .findOne({ _id: req.params.restaurantId })
    .select("_id");

  // -> 3) If the restaurant is not found, return an error
  if (!restaurant)
    return next({
      status: 404,
      message:
        language == "ar" ? "المطعم غير موجود" : "The Restaurant is Not Exist",
    });

  // -> 4) Find the foods by restaurant id
  const result = await food_model.find({
    restaurant_id: restaurant.id,
    is_approved: true,
  });

  res.json({
    status: true,
    data: result,
  });
});

/** ------------------------------------------------------
 * @desc delete food
 * @route /services/food/delete-food-item/:id
 * @method delete
 * @access private
 * @data {}
 * @return {status}
 * ------------------------------------------------------ */
export const deleteRestaurantItem = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers
  const { language } = req.headers || "en";

  // -> 2) Extract the id from the request params
  const { id } = req.params;

  // -> 3) Find the restaurant by user id
  const restaurant = await restaurant_model
    .findOne({ user_id: req.user.id })
    .select("_id");

  if (!restaurant)
    return next({
      status: 404,
      message:
        language == "ar" ? "المطعم غير موجود" : "The Restaurant is Not Exist",
    });

  const result = await food_model.findOneAndDelete({
    _id: id,
    restaurant_id: restaurant.id,
  });

  res.json({
    status: result != null,
  });
});
