
import app_manager_model from '../models/app_manager_model.js'
import notification_model from '../models/notification_model.js'
import instapay_manual_model from '../models/instapay_manual.js'
import user_model from '../models/user_model.js'
import { sendNotifications } from './notification_controller.js'



/** ------------------------------------------------------  
 * @desc insta pay manual
 * @route  insta pay manual
 * @method post
 * @access private insta pay manual 
/**  ------------------------------------------------------  */
export const payWithNumber = async (req , res , next) => {
    try { 
        const {number , ammount , subCategory , mainCategory , numberType} = req.body
        const userId = req.user.id
        const user = await user_model.findOne({_id : userId})
        const userSuperAdmin = await user_model.find({role : "super_admin"})
        if(!user) return next("this user not exist")
        var bodyEn = `${user.first_name} ${ user.first_name} will send mony ${ammount} for you ${number} ${numberType}`
        var bodyAr = `${user.first_name} ${ user.first_name} سيقوم بارسال مبلغ ${ammount} مالي لك ${number} ${numberType}`
        var titleAr = `send mony use instapay`
        var titleEn = "ارسال اموال عن طريق انستا باي"
        let notifications = []
        userSuperAdmin.forEach(ele => {
            notifications.push({
                receiver_id: ele.id ,
                user_id: req.user.id,
                tab: 6, /// this tap according to instapay 
                text_ar: bodyAr,
                text_en: bodyEn,
                main_category_id: mainCategory,
                sub_category_id: subCategory,
            })
            auth_model.find({ 'user_id': ele.id }).distinct('fcm').then(
                fcm => sendNotifications(fcm, language == 'ar' ? titleAr : titleEn, language == 'ar' ? bodyAr : bodyEn, 10003))

        })
        await notification_model.insertMany(notifications)
 
        return res.json({ 'status': true })

    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc get payment instapay notificatioon
 * @route  get payment instapay notificatioon
 * @method get
 * @access private get pay ment notificatioon 
/**  ------------------------------------------------------  */
export const getPaymentNotification = async (req , res , next) => {
    try {
        const {} = req.body
        const userId = req.user.id
        const notifications = await notification_model.find({
            tap : 6,
            receiver_id : userId
        }).populate(["main_category_id" , "sub_category_id"])

        return res.json({'status' : true , data : notifications})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc save reset in database
 * @route  save reset in database
 * @method post
 * @access private save reset in database
/**  ------------------------------------------------------  */
export const saveResetImage = async (req , res , next) => {
    try {
        const {imageUrl , subCategory , mainCategory} = req.body
        const userId = req.user.id
        await instapay_manual_model.create({
            user_id : userId,
            image_reset: imageUrl,
            approved : false,
            main_category_id: mainCategory,
            sub_category_id : subCategory
        })

        return res.json({'status' : true })
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc get all reset
 * @route  get all reset
 * @method post
 * @access private get all reset
/**  ------------------------------------------------------  */
export const getAllResetImage = async (req , res , next) => {
    try {

        const allResets = await instapay_manual_model.find({}).populate(["main_category_id" , "sub_category_id"])

        return res.json({'status' : true , data : allResets})
    } catch (error) {
        next(error)
    }
}

/** ------------------------------------------------------  
 * @desc change approve image
 * @route  change approve
 * @method put
 * @access private change approve image
/**  ------------------------------------------------------  */
export const approveResetImage = async (req , res , next) => {
    try {

        const {id} = req.params
        await instapay_manual_model.updateOne({
            _id : id,
            approved : true,
        })

        return res.json({'status' : true , approve : approved })
    } catch (error) {
        next(error)
    }
}

