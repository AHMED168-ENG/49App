import express from 'express'
import { getPaymobToken, getHMACByOrderId } from '../controllers/paymob_controller.js'
import { sendNotifications } from '../controllers/notification_controller.js'
import { serverURL, verifyToken } from '../helper.js'
import subscription_model from '../models/subscription_model.js'
import notification_model from '../models/notification_model.js'
import sub_category_model from '../models/sub_category_model.js'
import user_model from '../models/user_model.js'
import auth_model from '../models/auth_model.js'
import wallet_model from '../models/wallet_model.js'
import dynamic_ad_model from '../models/dynamic_ad_model.js'
import rider_model from '../models/rider_model.js'
import { calculateWithPaymob, calculateWithPaymobForAllOperations } from '../controllers/accounts_controller.js'
import { appRadioCategoryId, foodCategoryId, healthCategoryId, profileViewCategoryId } from '../controllers/ride_controller.js'
import restaurant_model from '../models/restaurant_model.js'
import doctor_model from '../models/doctor_model.js'
import gift_model from '../models/gift_model.js'
import { giftCashBack } from '../controllers/cash_back_controller.js'
import app_radio_model from '../models/app_radio_model.js'
import axios from 'axios'
import { chargeMony, sendMonyToUser } from '../validation/charging-wallet.js'
import handel_validation_errors from '../middleware/handelBodyError.js'
import app_manager_model from '../models/app_manager_model.js'

const router = express.Router()

router.post('/callback', async (req, res, next) => {
    try {
        const { hmac } = req.query
        const { id, success, payment_key_claims } = req.body.obj

        const paymentToken = await getPaymobToken()

        if (success == true && (await getHMACByOrderId(paymentToken, id)) == hmac) {

            const data = JSON.parse(payment_key_claims.billing_data.extra_description)

            if (data.method_type == 'gift') {

                const result = await Promise.all([
                    user_model.findById(data.sender_id).select('first_name last_name'),
                    user_model.findById(data.user_id).select('language'),
                    gift_model.findById(data.gift_id),
                ])

                const sender = result[0]
                const user = result[1]
                const gift = result[2]

                if (sender && user && gift) {

                    const titleAr = `هدية جديدة`
                    const titleEn = 'New Gift'

                    const bodyAr = `أرسل ${sender.first_name} ${sender.last_name} ${gift.name_en} كهدية لك`
                    const bodyEn = `${sender.first_name} ${sender.last_name} has sent ${gift.name_en} as present for you`

                    const notifcationObject = new notification_model({
                        text_ar: bodyAr,
                        text_en: bodyEn,
                        receiver_id: user.id,
                        tab: 1, 
                        user_id: sender.id,
                        type: 9,
                        direction: sender.id,
                    })

                    notifcationObject.save()

                    auth_model.find({ user_id: user.id }).distinct('fcm').then(fcm => {
                        if (fcm.length > 0) {
                            sendNotifications(
                                fcm, 
                                user.language == 'ar' ? titleAr : titleEn,
                                user.language == 'ar' ? bodyAr : bodyEn,
                                9,      
                                sender.id,
                            )
                        }
                    })
                }

                giftCashBack(sender.id, user.id, gift.value, data.is_card)
            }
            else if (data.method_type == 'subscription') {

                if (data.sub_category_id != profileViewCategoryId) {
                    calculateWithPaymob(data.total, data.sub_category_id, data.user_id, data.is_card)

                    axios.post(process.env.REAL_TIME_SERVER_URL + 'set-chat-enabled',
                        {
                            user_id: data.user_id,
                            category_id: data.sub_category_id,
                        },
                        {
                            headers:
                            {
                                'Key': process.env.REAL_TIME_SERVER_KEY
                            },
                        },
                    )
                }
                await subscription_model.updateOne({
                    user_id: data.user_id,
                    sub_category_id: data.sub_category_id,
                    is_premium: data.is_premium,
                }, {
                    user_id: data.user_id,
                    sub_category_id: data.sub_category_id,
                    is_premium: data.is_premium,
                    $inc: { days: data.days }
                }, { upsert: true, new: true, setDefaultsOnInsert: true })

                if (data.is_premium == true)
                    subscription_model.updateOne({
                        user_id: data.user_id,
                        sub_category_id: data.sub_category_id,
                        is_premium: true,
                    }, { is_active: true }).exec()



                const user = await user_model.findById(data.user_id).select('_id language')
                const fcm = await auth_model.find({ user_id: data.user_id }).select('fcm').distinct('fcm')

                const subCategory = await sub_category_model.findById(data.sub_category_id).select('name_ar name_en parent')


                if (data.is_premium == true) {

                    if (subCategory.id == appRadioCategoryId) {

                        const ad = await app_radio_model.find({ user_id: data.user_id }).sort({ createdAt: -1, _id: 1 }).limit(1)

                        if (ad && ad.length == 1) {
                            app_radio_model.updateOne({ _id: ad[0].id }, { is_active: true, $inc: { days: data.days } }).exec()
                        }
                    }
                    else if (subCategory.parent == foodCategoryId) {

                        restaurant_model.updateOne({ user_id: data.user_id, is_premium: false }, { is_premium: true }).exec()

                    } else if (subCategory.parent == healthCategoryId) {

                        doctor_model.updateOne({ user_id: data.user_id, is_premium: false }, { is_premium: true }).exec()

                    } else if (subCategory.id != profileViewCategoryId) {
                        dynamic_ad_model.updateMany({ user_id: data.user_id, sub_category_id: data.sub_category_id, is_premium: false }, { is_premium: true }).exec()
                    }

                }


                const subCategoryName = user.language == 'ar' ? subCategory.name_ar : subCategory.name_en

                const titleAr = 'تم الاشتراك بنجاح'
                const titleEn = 'Subscribed Successfully'

                const bodyAr = `تم الاشتراك بنجاح في ${subCategoryName} لمدة ${data.days} ايام`
                const bodyEn = `Successfully subscribed in ${subCategoryName} for ${data.days} days`

                const notification = new notification_model({
                    receiver_id: data.user_id,
                    tab: 3,
                    text_ar: bodyAr,
                    text_en: bodyEn,
                    type: 1001
                })

                await notification.save()

                await wallet_model.updateOne({ user_id: data.user_id }, { $inc: { total_payment: data.total } })

                if (user && fcm) {
                    sendNotifications(
                        fcm,
                        user.language == 'ar' ? titleAr : titleEn,
                        user.language == 'ar' ? bodyAr : bodyEn,
                        1001,
                    )
                }

                rider_model.updateOne({ user_id: data.user_id, category_id: data.sub_category_id }, { indebtedness: 0, free_ride: false }).exec()

            }
        }
        res.send()
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/callback', async (req, res, next) => {
    try {
        const { hmac, id } = req.query

        if (!hmac || !id || req.query.success == 'false') {
            return res.redirect(serverURL + `paymentstatus?status=false`)
        }

        const paymentToken = await getPaymobToken()

        const realHmac = await getHMACByOrderId(paymentToken, id)

        const isValid = realHmac == hmac
        res.redirect(serverURL + `paymentstatus?status=${isValid}`)

    } catch (e) {
        console.log(e)
        next(e)
    }
})

// *********** charging wallet ********************//
router.post('/charging-wallet' , chargeMony() , handel_validation_errors , verifyToken , async (req, res, next) => {
    try {
        const {amount} = req.body
        const gorseMony = await calculateWithPaymobForAllOperations(amount , req.user.id, true)
        var bodyEn = `your card charging with ${amount}`
        var bodyAr = `تم شحن الكرت ب ${amount}`
        var titleAr = `charge mony wallet`
        var titleEn = `شحن الاموال`

        const notificationObject = new notification_model({
            receiver_id: req.user.id,
            user_id: req.user.id,
            tab: 4,
            text_ar: bodyAr,
            text_en: bodyEn,
        })
        notificationObject.save()
        Promise.all([
            user_model.findById(req.user.id).select('language'),
            auth_model.find({ 'user_id': req.user.id }).distinct('fcm'),
        ]
        ).then(r => {
            const user = r[0]
            const fcm = r[1]
            sendNotifications(fcm, user.language == 'ar' ? titleAr : titleEn, user.language == 'ar' ? bodyAr : bodyEn, 10001)
        })
        let wallet = await wallet_model.findOne({user_id : req.user.id})
        if(!wallet) {
            await wallet_model.create({
                user_id : req.user.id,
            })
        }

        wallet = await wallet_model.findOneAndUpdate({user_id : req.user.id} , {user_wallet : gorseMony} , {new : true})
        res.json({ 'status': true , gorseMony , wallet })

    } catch (e) {
        next(e)
    }
})
// *********** charging wallet ********************//

// *********** send mony to user ********************//
router.post('/send-mony-to-user/:user_id' , sendMonyToUser() , handel_validation_errors , verifyToken , async (req, res, next) => {
    try {
        let {amount} = req.body
        let {user_id} = req.params
        const userWallet = await wallet_model.findOne({user_id : req.user.id}) 
        if(userWallet.user_wallet < amount) return next('you not have enough mony')
        const appManager = await app_manager_model.findOne({})
        const userWalletBefore = await wallet_model.findOneAndUpdate({user_id : req.user.id} , {$inc : {user_wallet : -parseFloat((amount + appManager.step_value))}} , {new : true})
        const userWalletAfter = await wallet_model.findOneAndUpdate({user_id : user_id} , {$inc : {user_wallet : amount}} , {new : true})
        res.json({ 'status': true , userWallet : userWalletBefore })
    } catch (e) {
        next(e)
    }
})
// *********** send mony to user ********************//

// *********** get mony balance ********************//
router.post('/get-user-balance' , sendMonyToUser() , handel_validation_errors , verifyToken , async (req, res, next) => {
    try {
        const appManager = await app_manager_model.findOne({})
        const userWallet = await wallet_model.findOne({user_id : req.user.id})
        if(userWallet.balance < (1000 + appManager.step_value)) return next('you cant not get balance now try again when you arrived to 1002')
        const userWalletAfter = await wallet_model.findOneAndUpdate({user_id : req.user.id} , {user_wallet : {$inc : 1000} , balance : 0} , {new : true})
        return userWalletAfter
    } catch (e) {
        next(e)
    }
})
// *********** get mony balance ********************//

// *********** get wallet details ********************//
router.get('/get-wallet-details', verifyToken , async (req, res, next) => {
    try {
        const userWallet = await wallet_model.findOne({user_id : req.user.id})
        res.json({ 'status': true , userWallet })

    } catch (e) {
        next(e)
    }
    
})
// *********** get wallet details ********************//

export default router