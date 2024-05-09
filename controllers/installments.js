import httpStatus from 'http-status'
import dynamic_ad_model from '../models/dynamic_ad_model.js'
import subscriptions_model from '../models/subscription_model.js'
import user_installments_model from '../models/user_installments.js'
import installments_model from '../models/installments.js'
import user_model from '../models/user_model.js'
import { buildError } from '../utils/buildError.js'
import { sendNotifications } from './notification_controller.js'
import auth_model from '../models/auth_model.js'
import installmentsUserAssets_model from '../models/installments_user_assets.js'
import notification_model from '../models/notification_model.js'
import { installmentsCategoryId } from './ride_controller.js'
import cron from "node-cron";
import { agenda } from '../agenda/agenda.js'


/** ------------------------------------------------------  
 * @desc add installments for ad
 * @route /installments
 * @method post
 * @access private add installments for ad
/** ------------------------------------------------------ */
export const addInstallments = async (req, res, next) => {
    try {

        const {id} = req.user 
        const ad_id = req.params.id
        const body = req.body
        const ad_data = await dynamic_ad_model.findOne({_id : ad_id}) 
        const subscriptions = await subscriptions_model.findOne({user_id : id , sub_category_id : installmentsCategoryId})
        const user = await user_model.findOne({_id : id})
        
        if(!ad_data) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "هذا الاعلان غير مسجل",
            en : "this advertising not register"
        }))
        
        if(!subscriptions) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "لا يمكنك اضافه تقسيط علي المنتج لانك غير مشترك قم بالاشتراك اولا",
            en : "You cannot add an installments because you are not a subscriber Subscribe first."
        }))

        const mainCategory = ad_data.main_category_id
        const supCategory = ad_data.sub_category_id
        const userSuperAdmin = await user_model.find({role : "super_admin"})
        var bodyEn = `${user.first_name} ${ user.first_name} add installments ${body.name} and wait you for approve`
        var bodyAr = `${user.first_name} ${ user.first_name} قام ياضافه ميزه التقسيط علي المنتج ${body.name} وينتظر منك الموافقه`
        var titleAr = `add installments`
        var titleEn = "اضافه ميزه التقسيط علي المنتج"
        
        const installments = await installments_model.create({
            ...body,
            user_id: id,
            ad_id: ad_id,
        })
        let notifications = []
        userSuperAdmin.forEach(ele => {
            notifications.push({
                receiver_id: ele.id ,
                user_id: req.user.id,
                tab: 8, /// this tap according to installments 
                text_ar: bodyAr,
                text_en: bodyEn,
                main_category_id: mainCategory,
                sub_category_id: supCategory,
            })
            auth_model.find({ 'user_id': ele.id }).distinct('fcm').then(
                fcm => sendNotifications(fcm, language == 'ar' ? titleAr : titleEn, language == 'ar' ? bodyAr : bodyEn, 10003))
        })

        var bodyEn2 = `${user.first_name} ${ user.first_name} add installments ${body.name }`
        var bodyAr2 = `${user.first_name} ${ user.first_name} قام باضافه ميزه التقسيط ${body.name }`
        var titleAr2 = `add installments`
        var titleEn2 = "اضافه ميزه التقسيط"
        user.installments_users.forEach(ele => {
            notifications.push({
                receiver_id: ele.id ,
                user_id: req.user.id,
                tab: 8, /// this tap according to instapay 
                text_ar: bodyAr2,
                text_en: bodyEn2,
                main_category_id: mainCategory,
                sub_category_id: supCategory,
            })
            auth_model.find({ 'user_id': ele.id }).distinct('fcm').then(
                fcm => sendNotifications(fcm, language == 'ar' ? titleAr2 : titleEn2, language == 'ar' ? bodyAr2 : bodyEn2, 10003))
        })
        await notification_model.insertMany(notifications)

        return res.json({status : true , data : installments})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc installments toggle approved
 * @route /installments
 * @method put
 * @access private installments toggle approved
/**  ------------------------------------------------------  */
export const installmentsToggleApproved = async (req, res, next) => {
    try {
        const {language} = req.headers
        const installments_id = req.params.id
        const installments = await installments_model.findOne({_id : installments_id}).populate([
            "user_id", 
            "ad_id"
        ])
                
        if(!installments) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "هذا ميزه التقسيط غير مسجل ",
            en : "this installments not register"
        }))
        
        await installments_model.updateOne({_id : installments_id} , {is_approved : !installments.is_approved}) 

        var bodyEn = `the admin approved your installments ${installments.name} from dashboard`
        var bodyAr = `لقد قاما الادمن بالموافقه علي ميزه التقسيط الخاص بك ${installments.name}من لوحه التحكم`
        var titleEn = `installments approval`
        var titleAr = "الموافقه علي ميزه التقسيط"
        

        await notification_model.create({
            receiver_id: installments.user_id.id ,
            user_id: req.user.id,
            tab: 8, /// this tap according to instapay 
            text_ar: bodyAr,
            text_en: bodyEn,
            main_category_id: installments.ad_id.main_category,
            sub_category_id: installments.ad_id.sup_category,
        })
        auth_model.find({ 'user_id': installments.user_id.id }).distinct('fcm').then(
            fcm => sendNotifications(fcm, language == 'ar' ? titleAr : titleEn, language == 'ar' ? bodyAr : bodyEn, 10003))

        return res.json({status : true , data : installments})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc follow user installments
 * @route /installments
 * @method post
 * @access private follow user installments
/**  -----------------------------------------------------  */
export const followUserInstallments = async (req, res, next) => {
    try {
        const {language} = req.headers
        const id = req.user.id
        const userId = req.params.id
        const user = await user_model.findOne({_id : id})                   

        const newUser = await user_model.findOneAndUpdate({_id : userId} , {$addToSet  : {installments_users : user.id}} , {new : true})

        var bodyEn = `some one ${user.first_name + " " + user.last_name} has been follow your installments`
        var bodyAr = `قام ${user.first_name + " " + user.last_name} تقسيطاتك`
        var titleEn = `installments following`
        var titleAr = "متابعه تقسيطاتك"
        
        await notification_model.create({
            receiver_id: userId ,
            user_id: req.user.id,
            tab: 8, /// this tap according to installments 
            text_ar: bodyAr,
            text_en: bodyEn, 
        })

        auth_model.find({ 'user_id': userId }).distinct('fcm').then(
            fcm => sendNotifications(fcm, language == 'ar' ? titleAr : titleEn, language == 'ar' ? bodyAr : bodyEn, 10003))

            return res.json({status : true , data : newUser})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc delete installments
 * @route /installments
 * @method delete
 * @access private delete installmentss
/**  ------------------------------------------------------  */
export const deleteInstallments = async (req, res, next) => {
    try {
        const installmentsId = req.params.id
        const user_id = req.user.id
        const installments = await installments_model.findOne({_id : installmentsId , user_id}).populate("user_id")
        if(!installments) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "ميزه التقسيط هذه غير مسجله ",
            en : "this installments not register"
        }))
        
        await installments_model.deleteOne({_id : installments})
        return res.json({status : true})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------    
 * @desc get Installments
 * @route /installments
 * @method get
 * @access private get installments
/** ------------------------------------------------------  */
export const getAllInstallments = async (req, res, next) => {
    try {
        const {id} = req.user
        const query = {user_id : id}
        if(req.query.userId) {
            query.user_id = req.query.userId
        }

        const installments = await installments_model.paginate(query , { populate : [
            "user_id" , 
            "ad_id"
        ]})

        return res.json({status : true , installments})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc get Installments approved
 * @route /installments approved
 * @method get
 * @access private get installments approved
/**  ------------------------------------------------------  */
export const getAllInstallmentsApproved = async (req, res, next) => {
    try {
        const {id} = req.user
        const query = {user_id : id , is_approved : true}
        if(req.query.userId) {
            query.user_id = req.query.userId
        }

        const installments = await installments_model.paginate(query , { populate : [
            "user_id", 
            "ad_id"
        ]})

        return res.json({status : true , installments})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc get single installments
 * @route /installments
 * @method get
 * @access private get single installments
/**  ------------------------------------------------------  */
export const getInstallments = async (req, res, next) => {
    try {
        const id = req.params.id
        const user_id = req.user.id
        const installment = await installments_model.findOne({_id : id , user_id}).populate(
            [
                "user_id",  
                "ad_id"
            ])

        return res.json({status : true , installment})
    } catch (error) {
        next(error)
    }
}


/** ------------------------------------------------------  
 * @desc add user installments request
 * @route /installments
 * @method get
 * @access private add user installments request
/**  ------------------------------------------------------  */
export const addUserInstallments = async (req, res, next) => {
    try {
        const installmentsId = req.params.id
        const {language} = req.headers
        const user_id = req.user.id
        const body = req.body

        const subscriptions = await subscriptions_model.findOne({user_id : user_id , sub_category_id : installmentsCategoryId}) 
        
        if(!subscriptions) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "لا يمكنك اضافه تقسيط علي المنتج لانك غير مشترك قم بالاشتراك اولا",
            en : "You cannot add an installments because you are not a subscriber. Subscribe first."
        }))

        const installments = await installments_model.findOne({_id : installmentsId})
        if(!installments) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "ميزه التقسيط هذه غير مسجله ",
            en : "this installment not register"
        }))
        
        if(!installments.is_approved) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "ميزه التقسيط هذه غير مفعله ",
            en : "This instalment feature is ineffective"
        }))

        var bodyEn =  `some one add request on your installment with start price ${body.start_price}`
        var bodyAr = `يضيف أحدهم طلبًا إلى ميزه التقسيط الخاص بك بمقدم ${body.start_price}`
        var titleEn = `installments request`
        var titleAr = "عرض تقسيط"
        
        await notification_model.create({
            receiver_id: installments.user_id.id ,
            user_id: req.user.id,
            tab: 8, /// this tap according to installments 
            text_ar: bodyAr,
            text_en: bodyEn,
            main_category_id: installments.main_category,
            sub_category_id: installments.sup_category,  
        })
        auth_model.find({ 'user_id': installments.user_id.id }).distinct('fcm').then(
            fcm => sendNotifications(fcm, language == 'ar' ? titleAr : titleEn, language == 'ar' ? bodyAr : bodyEn, 10003))

        const user_installments = await user_installments_model.create({user_id , ...body , installment_id : installmentsId})
        return res.json({status : true , user_installments})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc approve user installments request
 * @route /installments
 * @method get
 * @access private approve user installments request
/**  ------------------------------------------------------  */
export const approveUserInstallments = async (req, res, next) => {
    try {
        const installmentsRequestId = req.params.id
        const {language} = req.headers
        const user_id = req.user.id
        
        const installmentsRequest = await user_installments_model.findOne({_id : installmentsRequestId})
        if(!installmentsRequest) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "هذا الطلب غير مسجل",
            en : "this installment request not registered"
        }))
        const installment = await installments_model.findOne({_id : installmentsRequest.installment_id}).populate("ad_id")

        var bodyEn =  `لقد تم الموافقه علي عرض التقسيط التي قمت بتقديمه ${installment.name} قم بارسال الاوراق المطلوبه`
        var bodyAr = `The installment offer you submitted has been approved. ${installment.name}. Send the required documents`
        var titleEn = `installments request approve`
        var titleAr = " عرض تقسيط مقبول" 
        
        await notification_model.create({
            receiver_id: installmentsRequest.user_id ,
            user_id: user_id,
            tab: 8, /// this tap according to installments 
            text_ar: bodyAr,
            text_en: bodyEn,
            main_category_id: installment.ad_id.main_category,
            sub_category_id: installment.ad_id.sup_category,  
        })
        auth_model.find({ 'user_id': installmentsRequest.user_id }).distinct('fcm').then(
            fcm => sendNotifications(fcm, language == 'ar' ? titleAr : titleEn, language == 'ar' ? bodyAr : bodyEn, 10003))

        let user_installments_request = await user_installments_model.updateOne({_id : installmentsRequestId , user_id} , {is_approved : true})
        return res.json({status : true , data : user_installments_request})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc add agenda schedule
 * @route /installments
 * @method get
 * @access private add agenda schedule
/**  ------------------------------------------------------  */
export const addAgendaInstallments = async (req, res, next) => {
    try {
        const installmentsRequestId = req.params.id
        const {language} = req.headers
        const user_id = req.user.id
        
        const installmentsRequest = await user_installments_model.findOne({_id : installmentsRequestId}).populate("user_id")
        if(!installmentsRequest) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "هذا الطلب غير مسجل",
            en : "this installment request not registered"
        }))
        const installment = await installments_model.findOne({_id : installmentsRequest.installment_id}).populate("ad_id")
        const currentDate = new Date();
        const futureDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        await agenda.start()
            agenda.schedule(futureDate, 'scheduleUserInstallments', {installment , installmentsRequest});

        return res.json({status : true})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc get user installments
 * @route /user installments
 * @method get
 * @access private get user installments
/**  ------------------------------------------------------  */
export const allUsersInstallments = async (req, res, next) => {
    try {
        const installmentsId = req.params.id
        const installments = await installments_model.findOne({_id : installmentsId})
        if(!installments) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "ميزه الدفع هذه غير مسجله ",
            en : "this installments not register"
        }))

        if(!installments.is_approved) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "ميزه التقسيط هذه غير مفعله ولم يتم الموافقه عليها بعد",
            en : "This instalment feature is ineffective"
        }))
             

        const user_installments = await user_installments_model.paginate({installments_id : installmentsId} ,{populate : [
            {path : "user_id" } , 
            {path : "installment_id" , populate : [
                "user_id" , 
                "ad_id"
            ]}
        ] , sort : {createdAt : -1}})

        return res.json({status : true , data : user_installments})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc get user installments
 * @route /user installments
 * @method get
 * @access private get user installments
/**  ------------------------------------------------------  */
export const addUsersAssets = async (req, res, next) => {
    try {
        const installmentsId = req.params.id
        const body = req.body
        const userId = req.user.id
        const installments = await installments_model.findOne({_id : installmentsId})
        if(!installments) throw buildError(httpStatus.NOT_FOUND , JSON.stringify({
            ar : "ميزه الدفع هذه غير مسجله ",
            en : "this installments not register"
        }))

        const assets = await installmentsUserAssets_model.create({
            user_id: userId,
            installment_id : installmentsId,
            images : body.images,
        })

        return res.json({status : true , data : assets})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc get user installments
 * @route /user installments
 * @method get
 * @access private get user installments
/**  ------------------------------------------------------  */
export const getAllUsersAssets = async (req, res, next) => {
    try {

        const installmentsId = req.params.id
        const userId = req.user.id
        const user_installments_assets = await installmentsUserAssets_model.find({installment_id : installmentsId , user_id : userId})

        return res.json({status : true , data : user_installments_assets})

    } catch (error) {
        next(error)
    }
}