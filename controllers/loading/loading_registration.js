import loading_model from '../../models/loading_model.js';
import user_model from '../../models/user_model.js'
import loading_trip_model from '../../models/loading_trip_model.js';
import rating_model from '../../models/rating_model.js';
import {extractPictureUrls} from '../../helper.js';
import asyncWrapper from '../../utils/asyncWrapper.js';


/** ------------------------------------------------------  
 * @desc register with car for loading
 * @route /register
 * @method post
 /**  ------------------------------------------------------  */
export const createCarForLoading =asyncWrapper(async (req, res, next) => {
    const { language } = req.headers
    const { pictures , ...data   } = req.body
    // get user country code 
    const user = await user_model.findById(req.user.id).select('_id country_code')
    if (!user) return next({
        'status': 400,
        'message': language == 'ar' ? 'المستخدم غير موجود' : 'The User is Not Exist',
    })
    // check if user already registered in loading model
    const result = await loading_model.findOne({ user_id: req.user.id })
    if (result) return next({
        'status': 400,
        'message': language == 'ar' ? 'لقد قمت بالتسجيل من قبل' : 'You already Registered Before',
    })
    // create loading model
    const object = new loading_model({
        user_id: req.user.id,
        ...extractPictureUrls(pictures),
        country_code: user.country_code,
        ...data
    })
    await object.save()
    // update is_loading in user model to make true 
    user_model.updateOne({ _id: req.user.id }, { is_loading: true })
    res.json({
        'status': true,
    })
})
/** ------------------------------------------------------  
 * @desc delete register with car for loading
 * @route /delete-registration
 * @method delete
 /**  ------------------------------------------------------  */
export const deleteCarForLoading = asyncWrapper(async (req, res, next) => {
    // delete loading model by user id from req.user
    const rider = await loading_model.findOneAndDelete({ user_id: req.user.id })
    if (rider){
        // update is_loading in user model to make false
        // delete loading trip model by rider id
        await Promise.all([
            loading_trip_model.deleteMany({ rider_id: req.user.id }),
            user_model.updateOne({ _id: req.user.id }, { is_loading: false })
        ])
        // delete rating model by rider id
        rating_model.deleteMany({ user_id: req.user.id, category_id: rider.category_id })
        res.json({
            'status': true,
        })
    }else{
        next({ 'status': 400, 'message': 'The Car is Not Exist' })
    }
})


