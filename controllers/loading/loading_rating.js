import asyncWrapper from "../../utils/asyncWrapper.js";
import loading_model from '../../models/loading_model.js';
import sub_category_model from '../../models/sub_category_model.js'
import rating_model from '../../models/rating_model.js';
import { loadingCategoryId } from '../../controllers/ride_controller.js';
import {globalRatingService} from "../../utils/global_rating.js";
import ConflictError from "../../utils/types-errors/conflict-error.js";
import ForbiddenError  from "../../utils/types-errors/forbidden-error.js";
import mongoose from "mongoose";
import NotFoundError from "../../utils/types-errors/not-found.js";

/** ------------------------------------------------------  
 * @desc add rating for specific loading
 * @route /rating
 * @method post
 /**  ------------------------------------------------------  */
export const addRating = asyncWrapper(async (req, res, next) => {
    const { language } = req.headers
    const { field_one, field_two, field_three, field_five , field_four , comment, category_id, ad_id, user_id } = req.body
    // check if category exist or not  and get (_id, parent )
    const category = await sub_category_model.findById(category_id).select('_id parent')
    //  check if category and it have parent of loading category id
    if (category && category.parent == loadingCategoryId) {
        if (comment.length > 100) throw new ForbiddenError(language == 'ar' ? 'يجب ان لا يزيد النص عن 100 حرف' : 'Comment must be less than 100 characters')
        // save rating in db and using update to not create more then one rate and make update to it 
        await rating_model.updateOne({ user_rating_id: req.user.id, category_id, ad_id, user_id }, { field_one, field_two, field_three,field_four, field_five, comment, }, { upsert: true, new: true, setDefaultsOnInsert: true })

        // get count of rating of loading rider and grouping by rating
        const result = await globalRatingService(user_id, category_id)

        // update loading rider rating if rating > 0 by calculate total , else update 5.0 (by default = 5)
        if (result) {
            const res = await loading_model.updateOne({ user_id }, { rating: result }).exec()
        }
        res.json({ 'status': true })
    } else throw new ConflictError(language == 'ar' ? 'هذا الاعلان ليس من فئة التحميل' : 'This Ad is not from Loading Category')
})
/** ------------------------------------------------------  
 * @desc delete rating for specific loading
 * @route /delete-rating
 * @method delete
 /**  ------------------------------------------------------  */
export const deleteRating = asyncWrapper(async (req, res, next) => {
        const { category_id, ad_id } = req.body
        const { language } = req.headers
        const result = await rating_model.findOneAndDelete({ user_rating_id: req.user.id, category_id, ad_id })
        if (!result) throw new NotFoundError(language == 'ar' ? 'هذا الاعلان غير موجود' : 'This Ad is not exist')
        const newRating = await globalRatingService(result.user_id, category_id)

        if (newRating) {
            await loading_model.updateOne({ user_id: result.user_id }, { rating: newRating }).exec()
        }
        res.json({ 'status': true })
})

