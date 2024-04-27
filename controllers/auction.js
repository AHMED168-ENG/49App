import httpStatus from 'http-status'
import dynamic_ad_model from '../models/dynamic_ad_model.js'
import subscriptions_model from '../models/subscription_model.js'
import { buildError } from '../utils/buildError.js'
import { auctionCategoryId } from './ride_controller.js'



/** ------------------------------------------------------  
 * @desc add auction for ad
 * @route /auction
 * @method post
 * @access private add auction for ad
/**  ------------------------------------------------------  */
export const addAuction = async (req, res, next) => {
    try {
        // const {id} = req.user.id
        // const ad_id = req.params.id
        // const {price} = req.body
        // const ad_data = await dynamic_ad_model.findOne({_id : auctionCategoryId}) 
        // const subscriptions = await subscriptions_model.findOne({_id : ad_id}) 
        // if(!ad_data) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
        //     ar : "هذا الاعلان غير مسجل ",
        //     en : "this advertising not register"
        // }))
        // const mainCategory = ad_data.main_category_id
        // const supCategory = ad_data.sub_category_id
        // const supCategoryData = 

    } catch (error) {
        next(error)
    }
}
