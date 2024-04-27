import sub_category_model from "../../models/sub_category_model.js";
import auth_model from "../../models/auth_model.js";
import rating_model from "../../models/rating_model.js";
import { healthCategoryId } from "../ride_controller.js";
import doctor_model from "../../models/doctor_model.js";

// create rating controller
export const createRating = async (req, res, next) => {
  try {
    // extract language from headers
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
    // check if category exist or not  and get (_id, parent )
    const category = await sub_category_model
      .findById(category_id)
      .select("_id parent");
// check if category and it have parent of health category id
    if (category && category.parent == healthCategoryId) {
      // check if comment length > 100
      if (comment.length > 100)
        return next({
          stauts: 400,
          message:
            language == "ar"
              ? "أقصى عدد حروف للتعليق 100 حرف"
              : "Max Comment length is 100 Letters",
        });
// save rating in db and update doctor rating
      await rating_model.updateOne(
        { user_rating_id: req.user.id, category_id, ad_id, user_id },
        { field_one, field_two, field_three, comment },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
 // get count of rating of doctor and grouping by rating 
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
      // update doctor rating if rating > 0 by calculate total , else update 5.0
      if (result && result.length > 0) {
        const total =
          (result[0].field_one + result[0].field_two + result[0].field_three) /
          (3 * result[0].count);
        doctor_model
          .updateOne({ user_id }, { rating: parseFloat(total).toFixed(2) })
          .exec();
      } else doctor_model.updateOne({ user_id }, { rating: 5.0 }).exec();

      res.json({ status: true });
    }
    // if no category found return error
    else return next("category not found");
  } catch (e) {
    next(e);
  }
};

//******************************************************************************** */
// delete rating controller
export const deleteRating = async (req, res, next) => {
  try {
    const { category_id, ad_id } = req.body;
    const { language } = req.headers;
// VALIDATION
    if (!category_id || !ad_id) return next("Bad Request");
// check if rating exist or not and delete it 
    const result = await rating_model.findOneAndDelete({
      user_rating_id: req.user.id,
      category_id,
      ad_id,
    });
// send error if rating not found
    if (!result)
      return next({
        status: 400,
        message:
          language == "ar"
            ? "لا يوجد تقييم لهذا الاعلان"
            : "No Rating for this Ad",
      });
// update doctor rating if rating > 0 by calculate total , else update 5.0
    if (result) {
      if (result.length > 0) {
        const total =
          (result[0].field_one + result[0].field_two + result[0].field_three) /
          (3 * result[0].count);
        doctor_model
          .updateOne(
            { user_id: result.user_id },
            { rating: parseFloat(total).toFixed(2) }
          )
          .exec();
      } else
        doctor_model
          .updateOne({ user_id: result.user_id }, { rating: 5.0 })
          .exec();
    }

    res.json({ status: true });
  } catch (e) {
    next(e);
  }
};

// 129  + 480 + 267 + 140 = 1020
