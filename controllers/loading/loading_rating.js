import asyncWrapper from "../../utils/asyncWrapper.js";
import loading_model from '../../models/loading_model.js';
import sub_category_model from '../../models/sub_category_model.js'
import rating_model from '../../models/rating_model.js';
import { loadingCategoryId } from '../../controllers/ride_controller.js';


/** ------------------------------------------------------  
 * @desc add rating for specific loading
 * @route /rating
 * @method post
 /**  ------------------------------------------------------  */
export const addRating = asyncWrapper(async (req, res, next) => {
    console.log("here");
    const { language } = req.headers

    const { field_one, field_two, field_three, comment, category_id, ad_id, user_id } = req.body

    const category = await sub_category_model.findById(category_id).select('_id parent')

    if (category && category.parent == loadingCategoryId) {

        if (comment.length > 100) return next({ 'stauts': 400, 'message': language == 'ar' ? 'أقصى عدد حروف للتعليق 100 حرف' : 'Max Comment length is 100 Letters' })

        await rating_model.updateOne({ user_rating_id: req.user.id, category_id, ad_id, user_id }, { field_one, field_two, field_three, comment, }, { upsert: true, new: true, setDefaultsOnInsert: true })

        var result = await rating_model.aggregate(
            [
                { $match: { user_id, category_id } },
                {
                    $group:
                    {
                        _id: null,
                        field_one: { $sum: "$field_one" },
                        field_two: { $sum: "$field_two" },
                        field_three: { $sum: "$field_three" },
                        count: { $sum: 1 }
                    }
                }
            ]
        )
        if (result && result.length > 0) {
            const total = (result[0].field_one + result[0].field_two + result[0].field_three) / (3 * result[0].count)
            loading_model.updateOne({ user_id }, { rating: parseFloat(total).toFixed(2) }).exec()
        } else rider_model.updateOne({ user_id }, { rating: 5.0 }).exec()

        res.json({ 'status': true })

    } else return next('Bad Request')
})
/** ------------------------------------------------------  
 * @desc delete rating for specific loading
 * @route /delete-rating
 * @method delete
 /**  ------------------------------------------------------  */
export const deleteRating = asyncWrapper(async (req, res, next) => {

    try {

        const { category_id, ad_id } = req.body
        const { language } = req.headers

        if (!category_id || !ad_id) return next('Bad Request')

        const result = await rating_model.findOneAndDelete({ user_rating_id: req.user.id, category_id, ad_id })

        if (!result) return next({ 'status': 400, 'message': language == 'ar' ? 'لا يوجد تقييم لهذا الاعلان' : 'No Rating for this Ad' })

        if (result) {
            if (result.length > 0) {
                const total = (result[0].field_one + result[0].field_two + result[0].field_three) / (3 * result[0].count)
                loading_model.updateOne({ user_id: result.user_id }, { rating: parseFloat(total).toFixed(2) }).exec()
            }
            else loading_model.updateOne({ user_id: result.user_id }, { rating: 5.0 }).exec()
        }


        res.json({ 'status': true })

    } catch (e) {
        next(e)
    }
})

