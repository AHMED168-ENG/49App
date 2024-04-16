import user_model from "../../models/user_model.js";
import restaurant_model from "../../models/restaurant_model.js";
import subscription_model from "../../models/subscription_model.js";
import food_model from "../../models/food_model.js";
import food_order_model from "../../models/food_order_model.js";
import rating_model from "../../models/rating_model.js";
import sub_category_model from "../../models/sub_category_model.js";
import main_category_model from "../../models/main_category_model.js";

/** ------------------------------------------------------
 * @desc create restaurant
 * @route /services/food/register
 * @method post
 * @access private
 * @data {category_id, name, location, work_from, work_to, available_day, pictures}
 * @return {status}
 * ------------------------------------------------------ */
export const createRestuarant = async (req, res, next) => {
  try {
    const { language } = req.headers;
    const {
      category_id,
      name,
      location,
      work_from,
      work_to,
      available_day,
      pictures,
    } = req.body;
    const user = await user_model
      .findById(req.user.id)
      .select("_id country_code");

    if (!user)
      return next({
        status: 400,
        message:
          language == "ar" ? "المستخدم غير موجود" : "The User is Not Exist",
      });

    const result = await restaurant_model.findOne({ user_id: req.user.id });

    if (result)
      return next({
        status: 400,
        message:
          language == "ar"
            ? "لقد قمت بالتسجيل من قبل"
            : "You already Registered Before",
      });

    const subscription = await subscription_model.findOne({
      user_id: req.user.id,
      sub_category_id: category_id,
      is_premium: true,
    });

    if (
      !location ||
      !name ||
      !work_from ||
      !work_to ||
      !work_to ||
      !available_day ||
      !pictures
    )
      return next("Bad Request");

    const object = new restaurant_model({
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

    await object.save();

    user_model.updateOne({ _id: req.user.id }, { is_restaurant: true }).exec();

    res.json({
      status: true,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

/** ------------------------------------------------------
 * @desc delete restaurant
 * @route /services/food/delete-registration
 * @method delete
 * @access private
 * @data {}
 * @return {status}
 * ------------------------------------------------------ */
export const deleteRestuarant = async (req, res, next) => {
  try {
    const data = await restaurant_model.findOneAndDelete({
      user_id: req.user.id,
    });

    if (data) {
      await Promise.all([
        food_model.deleteMany({ restaurant_id: req.user.id }),
        food_order_model.deleteMany({ restaurant_id: req.user.id }),
        rating_model.deleteMany({
          user_id: req.user.id,
          category_id: data.category_id,
        }),
      ]);
    }

    user_model.updateOne({ _id: req.user.id }, { is_restaurant: false }).exec();

    res.json({
      status: true,
    });
  } catch (e) {
    next(e);
  }
};

/** ------------------------------------------------------
 * @desc update restaurant info
 * @route /services/food/update-info
 * @method post
 * @access private
 * @data {name, desc, price, picture}
 * @return {status, data}
 * ------------------------------------------------------ */
export const updateRestaurantInfo = async (req, res, next) => {
  try {
    const { name, desc, price, picture } = req.body;

    if (!name || !desc || !price) return next("Bad Request");

    const restaurant = await restaurant_model
      .findOne({ user_id: req.user.id, is_approved: true, is_active: true })
      .select("_id category_id");

    if (!restaurant) return next("Bad Request");

    const object = new food_model({
      restaurant_id: req.user.id,
      category_id: restaurant.category_id,
      name,
      desc,
      price,
      picture,
    });

    const result = await object.save();

    return res.json({
      status: true,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

/** ------------------------------------------------------
 * @desc get restaurant by id
 * @route /services/food/restaurant/:id
 * @method get
 * @access private
 * @data {}
 * @return {status, data}
 * ------------------------------------------------------ */
export const getRestaurantById = async (req, res, next) => {
  try {
    const { language } = req.headers;

    const result = await restaurant_model
      .findById(req.params.id)
      .select(
        "category_id user_id pictures name location work_from work_to available_day rating is_approved is_active is_premium country_code"
      );

    if (!result)
      return next({
        status: 404,
        message:
          language == "ar" ? "المطعم غير موجود" : "The Restaurant is Not Exist",
      });

    const subCategory = await sub_category_model
      .findById(result.category_id)
      .select("name_ar name_en parent");

    if (!subCategory) return next("Bad Request");

    const mainCategory = await main_category_model
      .findById(subCategory.parent)
      .select("name_ar name_en");

    if (!mainCategory) return next("Bad Request");

    const subscriptions = await subscription_model
      .find({
        sub_category_id: req.params.categoryId,
        user_id: { $in: [req.user.id, result.user_id] },
      })
      .distinct("user_id");

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
  } catch (e) {
    next(e);
  }
};

/** ------------------------------------------------------
 * @desc get restaurants by category
 * @route /services/food/restaurants/:categoryId
 * @method get
 * @access private
 * @data {}
 * @return {status, data}
 * ------------------------------------------------------ */
export const getRestaurantsCategory = async (req, res, next) => {
  try {
    const { language } = req.headers;

    const { page } = req.query;

    const user = await user_model.findById(req.user.id).select("country_code");

    if (!user) return next("Bad Request");

    const subCategory = await sub_category_model
      .findById(req.params.categoryId)
      .select("name_ar name_en parent");

    if (!subCategory) return next("Bad Request");

    const mainCategory = await main_category_model
      .findById(subCategory.parent)
      .select("name_ar name_en");

    if (!mainCategory) return next("Bad Request");

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

    const usersIds = [req.user.id];

    result.forEach((ad) => {
      if (!usersIds.includes(ad.user_id)) usersIds.push(ad.user_id);
    });

    const subscriptions = await subscription_model
      .find({
        sub_category_id: req.params.categoryId,
        user_id: { $in: usersIds },
      })
      .distinct("user_id");

    const totalOrders = await food_order_model.aggregate([
      {
        $match: {
          restaurant_id: { $in: usersIds },
        },
      },
      { $group: { _id: "$restaurant_id", total: { $sum: 1 } } },
    ]);

    const now = new Date();

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

    res.json({
      status: true,
      data: result,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

/** ------------------------------------------------------
 * @desc get foods
 * @route /services/food/foods
 * @method get
 * @access private
 * @data {}
 * @return {status, data}
 * ------------------------------------------------------ */
export const getRestaurantItems = async (req, res, next) => {
  try {
    const result = await food_model.find({
      restaurant_id: req.user.id,
      is_approved: true,
    });

    res.json({
      status: true,
      data: result,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

/** ------------------------------------------------------
 * @desc add food
 * @route /services/food/add-food
 * @method post
 * @access private
 * @data {name, desc, price, picture}
 * @return {status, data}
 * ------------------------------------------------------ */
export const addRestaurantItem = async (req, res, next) => {
  try {
    const { name, desc, price, picture } = req.body;

    if (!name || !desc || !price) return next("Bad Request");

    const restaurant = await restaurant_model
      .findOne({ user_id: req.user.id, is_approved: true, is_active: true })
      .select("_id category_id");

    if (!restaurant) return next("Bad Request");

    const object = new food_model({
      restaurant_id: req.user.id,
      category_id: restaurant.category_id,
      name,
      desc,
      price,
      picture,
    });

    const result = await object.save();

    return res.json({
      status: true,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

/** ------------------------------------------------------
 * @desc delete food
 * @route /services/food/delete-food-item
 * @method delete
 * @access private
 * @data {id}
 * @return {status}
 * ------------------------------------------------------ */
export const deleteRestaurantItem = async (req, res, next) => {
  try {
    const { id } = req.body;

    if (!id) return next("Bad Request");

    const restaurant = await restaurant_model
      .findOne({ user_id: req.user.id })
      .select("_id");

    if (!restaurant) return next({ status: 404, message: "Not Found" });

    const result = await food_model.findOneAndDelete({
      _id: id,
      restaurant_id: req.user.id,
    });

    res.json({
      status: result != null,
    });
  } catch (e) {
    next(e);
  }
};
