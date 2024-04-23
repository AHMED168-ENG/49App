import asyncWrapper from "../utils/asyncWrapper.js";

import notification_model from "../models/notification_model.js";
import sub_category_model from "../models/sub_category_model.js";
import subscription_model from "../models/subscription_model.js";
import user_model from "../models/user_model.js";
import NotFoundError from "../utils/types-errors/not-found.js";

/** ------------------------------------------------------
 * @desc get social activities for user
 * @route /notifications/social?page=?
 * @method get
 * @access private
 * @data {}
 * @return {status, data}
 * ------------------------------------------------------ */
export const getSocialActivities = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers
  const { language } = req.headers;

  // -> 2) Get the page number from the query
  const { page } = req.query;

  // -> 3) Find all notifications for the user
  const activities = await notification_model
    .find({ receiver_id: req.user.id, tab: 1, user_id: { $ne: req.user.id } })
    .sort({ createdAt: -1, _id: 1 })
    .skip(((page ?? 1) - 1) * 20)
    .limit(20);

  /*-------------------Note-------------------*/
  /* we don't need to check if activities is defined or not because find method always return an array */
  // return if no activities without make any operations
  if (activities.length === 0) return res.json({ status: true, data: [] });

  // -> 4) Get all unique user ids from the notifications
  const userIds = [...new Set(activities.map((activity) => activity.user_id))];

  // -> 5) Find all users with the unique ids
  let users = [];
  if (userIds.length > 0)
    users = await user_model
      .find({ _id: { $in: userIds } })
      .select("first_name last_name profile_picture profile_picture");

  // -> 6) Loop through the activities and add the user to the activity
  activities.forEach((activity) => {
    activity._doc.text = language == "ar" ? activity.text_ar : activity.text_en;
    delete activity._doc.text_ar;
    delete activity._doc.text_en;
    const sender = users.find((user) => user.id === activity.user_id);
    if (sender) activity._doc.sender = sender;
  });

  // -> 7) Send the response
  res.json({
    status: true,
    data: result,
  });
});

/** ------------------------------------------------------
 * @desc get service activities for user
 * @route /notifications/service?page=?
 * @method get
 * @access private
 * @data {}
 * @return {status, data}
 * ------------------------------------------------------ */
export const getServiceActivities = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers
  const { language } = req.headers;

  // -> 2) Get the page number from the query
  const { page } = req.query;

  // -> 3) Find all service activities for the user
  const activities = await notification_model
    .find({ receiver_id: req.user.id, tab: 2 })
    .sort({ createdAt: -1, _id: 1 })
    .skip(((page ?? 1) - 1) * 20)
    .limit(20);

  /*-------------------Note-------------------*/
  /* we don't need to check if activities is defined or not because find method always return an array */
  // return if no activities without make any operations
  if (activities?.length === 0) return res.json({ status: true, data: [] });

  // 4) Extract unique user IDs and sub-category IDs
  const userIds = [req.user.id];
  const subCategoriesIds = [];

  // 5) Loop through the activities and extract the user IDs and sub-category IDs
  activities.forEach((activity) => {
    if (!userIds.includes(activity.user_id)) userIds.push(activity.user_id);
    if (!subCategoriesIds.includes(activity.sub_category_id))
      subCategoriesIds.push(activity.sub_category_id);
  });

  // 6) Fetch free sub-categories
  const freeSubCategories = await sub_category_model
    .find({ _id: { $in: subCategoriesIds }, daily_price: 0 })
    .distinct("_id");

  // 7) Fetch subscriptions
  const subscriptions = await subscription_model
    .find({
      sub_category_id: { $in: subCategoriesIds },
      user_id: { $in: userIds },
    })
    .select("sub_category_id user_id");

  // 8) Update activities with subscription information and localized text
  activities.forEach((activity) => {
    activity._doc.is_subscription = false;

    for (const subscription of subscriptions) {
      if (
        freeSubCategories.includes(activity.sub_category_id) ||
        (subscription.sub_category_id === activity.sub_category_id &&
          (activity.user_id === subscription.user_id ||
            subscription.user_id === req.user.id))
      ) {
        activity._doc.is_subscription = true;
        break;
      }
    }

    activity._doc.text =
      language === "ar" ? activity.text_ar : activity.text_en;

    // Remove the localized text from the response
    delete activity._doc.text_ar;
    delete activity._doc.text_en;
  });

  // 6) Send response
  res.json({ status: true, data: activities });
});

/** ------------------------------------------------------
 * @desc get app activities for user
 * @route /notifications/app?page=?
 * @method get
 * @access private
 * @data {}
 * @return {status, data}
 * ------------------------------------------------------ */
export const getAppActivities = asyncWrapper(async (req, res, next) => {
  // -> 1) Get the language from the request headers
  const { language } = req.headers;

  // -> 2) Get the page number from the query
  const { page } = req.query;

  // -> 3) Find all app activities for the user
  const activities = await notification_model
    .find({
      receiver_id: req.user.id,
      tab: 3,
    })
    .sort({ createdAt: -1, _id: 1 })
    .skip(((page ?? 1) - 1) * 20)
    .limit(20);

  /*-------------------Note-------------------*/
  /* we don't need to check if activities is defined or not because find method always return an array */
  // return if no activities without make any operations
  if (activities.length === 0) return res.json({ status: true, data: [] });

  // -> 4) Update the activities with the localized text
  activities.forEach((e) => {
    e._doc.text = language == "ar" ? e.text_ar : e.text_en;

    delete e._doc.text_ar;
    delete e._doc.text_en;
  });

  // -> 5) Send the response
  res.json({
    status: true,
    data: activities,
  });
});

/** ------------------------------------------------------
 * @desc set activity as read
 * @route /notifications/set-as-read
 * @method post
 * @access private
 * @data {id}
 * @return {status}
 * ------------------------------------------------------ */
export const setActivityRead = asyncWrapper(async (req, res, next) => {
  const { language } = req.headers;
  // -> 1) Get the activity ID from the request body
  const { id } = req.body;

  // -> 2) First, check if the activity exists
  const activity = await notification_model.findOne({
    _id: id,
    receiver_id: req.user.id,
  });

  // -> 3) If the activity does not exist, throw an error
  if (!activity)
    throw new NotFoundError(
      language === "ar" ? "النشاط غير موجود" : "Activity not found"
    );

  // -> 4) Update the activity as read
  await notification_model.updateOne(
    { _id: id, receiver_id: req.user.id },
    { is_read: true }
  );

  res.json({
    status: true,
  });
});
