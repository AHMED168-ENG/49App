import httpStatus from 'http-status'
import dynamic_ad_model from '../models/dynamic_ad_model.js'
import subscriptions_model from '../models/subscription_model.js'
import auction_model from '../models/auction.js'
import user_auction_model from '../models/user_auction.js'
import user_model from '../models/user_model.js'
import { buildError } from '../utils/buildError.js'
import { auctionCategoryId } from './ride_controller.js'
import { sendNotifications } from './notification_controller.js'
import auth_model from '../models/auth_model.js'
import notification_model from '../models/notification_model.js'



/** ------------------------------------------------------  
 * @desc add auction for ad
 * @route /auction
 * @method post
 * @access private add auction for ad
/**  ------------------------------------------------------  */
export const addAuction = async (req, res, next) => {
    try {

        const {id} = req.user
        const ad_id = req.params.id
        const body = req.body
        const ad_data = await dynamic_ad_model.findOne({_id : ad_id}) 
        const subscriptions = await subscriptions_model.findOne({user_id : id , sub_category_id : auctionCategoryId}) 
        const user = await user_model.findOne({_id : id}).populate("auction_users")
        
        if(!ad_data) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "هذا الاعلان غير مسجل ",
            en : "this advertising not register"
        }))

        if(!subscriptions) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "لا يمكنك اضافه مزاد لانك غير مشترك قم بالاشتراك اولا",
            en : "You cannot add an auction because you are not a subscriber. Subscribe first."
        }))

        const mainCategory = ad_data.main_category_id
        const supCategory = ad_data.sub_category_id
        const userSuperAdmin = await user_model.find({role : "super_admin"})
        var bodyEn = `${user.first_name} ${ user.first_name} add auction ${body.name} and wait you for approve`
        var bodyAr = `${user.first_name} ${ user.first_name} قام بانشاء مزاد ${body.name} وينتظر منك الموافقه`
        var titleAr = `add auction`
        var titleEn = "انشاء مزاد"
        
        const auction = await auction_model.create({
            ...body,
            user_id: id,
            main_category: mainCategory,
            sup_category: supCategory,
            ad_id: ad_id,
        })
        let notifications = []
        userSuperAdmin.forEach(ele => {
            notifications.push({
                receiver_id: ele.id ,
                user_id: req.user.id,
                tab: 7, /// this tap according to instapay 
                text_ar: bodyAr,
                text_en: bodyEn,
                main_category_id: mainCategory,
                sub_category_id: supCategory,
            })
            auth_model.find({ 'user_id': ele.id }).distinct('fcm').then(
                fcm => sendNotifications(fcm, language == 'ar' ? titleAr : titleEn, language == 'ar' ? bodyAr : bodyEn, 10003))
        })

        var bodyEn2 = `${user.first_name} ${ user.first_name} add auction ${body.name}`
        var bodyAr2 = `${user.first_name} ${ user.first_name} قام بانشاء مزاد ${body.name}`
        var titleAr2 = `add auction`
        var titleEn2 = "انشاء مزاد"
        user.auction_users.forEach(ele => {
            notifications.push({
                receiver_id: ele.id ,
                user_id: req.user.id,
                tab: 7, /// this tap according to instapay 
                text_ar: bodyAr2,
                text_en: bodyEn2,
                main_category_id: mainCategory,
                sub_category_id: supCategory,
            })
            auth_model.find({ 'user_id': ele.id }).distinct('fcm').then(
                fcm => sendNotifications(fcm, language == 'ar' ? titleAr2 : titleEn2, language == 'ar' ? bodyAr2 : bodyEn2, 10003))
        })
        await notification_model.insertMany(notifications)

        return res.json({status : true , data : auction})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc follow user auctions
 * @route /auction
 * @method post
 * @access private follow user auctions
/**  ------------------------------------------------------  */
export const followUserAuction = async (req, res, next) => {
    try {
        const id = req.user.id
        const userId = req.params.id
        // const auction = await auction_model.findOne({_id : auctionId}).populate("user_id")
        const user = await user_model.findOne({_id : id})                   
        // if(!auction) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
        //     ar : "هذا المزاد غير مسجل ",
        //     en : "this auction not register"
        // }))

        let auction = await user_model.findOneAndUpdate({_id : userId} , {$addToSet  : {auction_users : user.id}} , {new : true})

        var bodyEn = `some has been follow your auction`
        var bodyAr = `قام احد بمتابعه مزاداتك`
        var titleEn = `auction following`
        var titleAr = "متابعه مزادك"
        
        await notification_model.create({
            receiver_id: userId ,
            user_id: req.user.id,
            tab: 7, /// this tap according to auction 
            text_ar: bodyAr,
            text_en: bodyEn,
            // main_category_id: auction.main_category,
            // sub_category_id: auction.sup_category,  
        })
        auth_model.find({ 'user_id': userId }).distinct('fcm').then(
            fcm => sendNotifications(fcm, language == 'ar' ? titleAr : titleEn, language == 'ar' ? bodyAr : bodyEn, 10003))

            return res.json({status : true , data : auction})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc delete auctions
 * @route /auction
 * @method delete
 * @access private delete auctions
/**  ------------------------------------------------------  */
export const deleteAuction = async (req, res, next) => {
    try {
        const auctionId = req.params.id
        const user_id = req.user.id
        const auction = await auction_model.findOne({_id : auctionId , user_id}).populate("user_id")
        if(!auction) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "هذا المزاد غير مسجل ",
            en : "this auction not register"
        }))
        
        await auction_model.deleteOne({_id : auctionId})
        return res.json({status : true})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc end auctions
 * @route /auction
 * @method put
 * @access private end auctions
/**  ------------------------------------------------------  */
export const endAuction = async (req, res, next) => {
    try {
        const id = req.user.id 
        const auctionId = req.params.id
        let auction = await auction_model.findOne({_id : auctionId , user_id : id}).populate("user_id")
        if(!auction) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "هذا المزاد غير مسجل ",
            en : "this auction not register"
        }))

        auction = await auction_model.findOneAndUpdate({_id : auctionId , user_id : id} , {$set : {is_finished : true}} , {new : true})
        
        return res.json({status : true , data : auction})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc get auctions
 * @route /auction
 * @method get
 * @access private get auctions
/**  ------------------------------------------------------  */
export const getAllAuctions = async (req, res, next) => {
    try {
        const {id} = req.user
        const query = {user_id : id}
        if(req.query.finished) {
            query.is_finished = true
        }
        if(req.query.userId) {
            query.user_id = req.query.userId
        }
        const auction = await auction_model.paginate(query , {populate :  [
            "user_id" , 
            "sup_category" , 
            "main_category" , 
            "ad_id"
        ]})

        return res.json({status : true , auction})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc get auctions approved
 * @route /auction approved
 * @method get
 * @access private get auctions approved
/**  ------------------------------------------------------  */
export const getAllAuctionsApproved = async (req, res, next) => {
    try {
        const {id} = req.user
        const query = {user_id : id , is_approved : true} 
        if(req.query.finished) {
            query.is_finished = true
        }
        if(req.query.userId) {
            query.user_id = req.query.userId
        }
        const auction = await auction_model.paginate(query , {populate : [
            "user_id" , 
            "sup_category" , 
            "main_category" , 
            "ad_id"
        ]})

        return res.json({status : true , auction})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc get single auction
 * @route /auction
 * @method get
 * @access private get single auction
/**  ------------------------------------------------------  */
export const getAuction = async (req, res, next) => {
    try {
        const id = req.params.id
        const user_id = req.user.id
        const auction = await auction_model.findOne({_id : id , user_id}).populate(
            [
                "user_id" , 
                "sup_category" , 
                "main_category" , 
                "ad_id"
            ])

        return res.json({status : true , auction})
    } catch (error) {
        next(error)
    }
}



/** ------------------------------------------------------  
 * @desc auction toggle approved
 * @route /auction
 * @method put
 * @access private auction toggle approved
/**  ------------------------------------------------------  */
export const auctionToggleApproved = async (req, res, next) => {
    try {
        const {language} = req.headers
        const auction_id = req.params.id
        const auction = await auction_model.findOne({_id : auction_id}).populate([
            "user_id" , 
            "sup_category" , 
            "main_category" , 
            "ad_id"
        ])
                
        if(!auction) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "هذا المزاد غير مسجل ",
            en : "this auction not register"
        }))
        
        await auction_model.updateOne({_id : auction_id} , {is_approved : !auction.is_approved}) 

        var bodyEn = `the admin approved your auction ${auction.name} from dashboard`
        var bodyAr = `لقد قاما الادمن بالموافقه علي المزاد الخاص بك ${auction.name}من لوحه التحكم`
        var titleEn = `auction approval`
        var titleAr = "الموافقه علي المزاد"
        

        await notification_model.create({
            receiver_id: auction.user_id.id ,
            user_id: req.user.id,
            tab: 7, /// this tap according to instapay 
            text_ar: bodyAr,
            text_en: bodyEn,
            main_category_id: auction.main_category,
            sub_category_id: auction.sup_category,
        })
        auth_model.find({ 'user_id': auction.user_id.id }).distinct('fcm').then(
            fcm => sendNotifications(fcm, language == 'ar' ? titleAr : titleEn, language == 'ar' ? bodyAr : bodyEn, 10003))

        return res.json({status : true , data : auction})
    } catch (error) {
        next(error)
    }
}



/** ------------------------------------------------------  
 * @desc add user auction
 * @route /auction
 * @method get
 * @access private add user auction
/**  ------------------------------------------------------  */
export const addUserAuction = async (req, res, next) => {
    try {
        const auctionId = req.params.id
        const {language} = req.headers
        const user_id = req.user.id
        const body = req.body
        const auction = await auction_model.findOne({_id : auctionId})
        const allUserAuctionDocs = await user_auction_model.find({auction_id : auctionId , is_accepted : true}).sort({createdAt : -1})        
        let is_accepted = false
        if(allUserAuctionDocs.length) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "تم شراء هذا المزاد",
            en : "This auction was bought."
        }))
        if(!auction.is_approved) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "هذا المزاد غير مفعل من جهه الادمن",
            en : "This auction is ineffective from the addict side."
        }))

        if(!auction) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "هذا المزاد غير مسجل ",
            en : "this auction not register"
        }))
        if(auction.is_finished) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "هذا المزاد انتهي  ",
            en : "this auction is finished"
        }))
                        
        if(body.price < auction.small_price) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : `غفوا اقل قيمه مسموح بها في المزاد هيا ${auction.small_price}`,
            en : `The lowest value allowed in the auction is ${auction.small_price}`
        }))

        if(auction.need_price && (auction.need_price < body.price)) { 
            is_accepted = true
            await user_auction_model.updateOne({_id : auctionId} , {
                is_finished : true,
                end_at : Date.now()
            })

            var bodyEn =  `your auction has been finshed and arrived to your price need ${body.price}`
            var bodyAr = `لقد تم الانتهاء من المزاد الخاص بك ووصل السعر الذي تريده إلى ${body.price}`
            var titleEn = `auction finishing`
            var titleAr = "مزادك انتها"
            
            await notification_model.create({
                receiver_id: auction.user_id.id ,
                user_id: req.user.id,
                tab: 7, /// this tap according to auction 
                text_ar: bodyAr,
                text_en: bodyEn,
                main_category_id: auction.main_category,
                sub_category_id: auction.sup_category,  
            })
            auth_model.find({ 'user_id': auction.user_id.id }).distinct('fcm').then(
                fcm => sendNotifications(fcm, language == 'ar' ? titleAr : titleEn, language == 'ar' ? bodyAr : bodyEn, 10003))
        } else {
            var bodyEn =  `some one add request on your auction with ${body.price}`
            var bodyAr = `يضيف أحدهم طلبًا إلى المزاد الخاص بك بمبلغ ${body.price}`
            var titleEn = `auction request`
            var titleAr = "عرض مزاد"
            
            await notification_model.create({
                receiver_id: auction.user_id.id ,
                user_id: req.user.id,
                tab: 7, /// this tap according to auction 
                text_ar: bodyAr,
                text_en: bodyEn,
                main_category_id: auction.main_category,
                sub_category_id: auction.sup_category,  
            })
            auth_model.find({ 'user_id': auction.user_id.id }).distinct('fcm').then(
                fcm => sendNotifications(fcm, language == 'ar' ? titleAr : titleEn, language == 'ar' ? bodyAr : bodyEn, 10003))
        }

        const user_auction = await user_auction_model.create({user_id , ...body , auction_id : auctionId , is_accepted})
        return res.json({status : true , user_auction})
    } catch (error) {
        next(error)
    }
}


/** ------------------------------------------------------  
 * @desc get user auctions
 * @route /user auction
 * @method get
 * @access private get user auctions
/**  ------------------------------------------------------  */
export const allUsersAuction = async (req, res, next) => {
    try {
        const auctionId = req.params.id
        const user_id = req.user.id

        const auction = await auction_model.findOne({_id : auctionId})
        if(!auction) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "هذا المزاد غير مسجل ",
            en : "this auction not register"
        }))
        if(!auction.is_finished) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "لايمكنك الحصول علي كل المستخدمين ال بعد انتهاء المزاد",
            en : "You cannot get all the users until after the auction ends"
        }))
             

        const user_auction = await user_auction_model.paginate({auction_id : auctionId , user_id : user_id} , { populate : [
            {path : "user_id" } , 
            {path : "auction_id" , populate : [
                "user_id" , 
                "sup_category" , 
                "main_category" , 
                "ad_id"
            ]}
        ] , sort : {createdAt : -1}})
        return res.json({status : true , data : user_auction})
    } catch (error) {
        next(error)
    }
}