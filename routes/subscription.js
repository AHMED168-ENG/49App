import express from 'express'
import { verifyToken, tryVerify } from '../helper.js'
import sub_category_model from '../models/sub_category_model.js'
import user_model from '../models/user_model.js'
import auth_model from '../models/auth_model.js'
import { getPaymobToken, makeOrder, makeWalletOrder, paymentKeys } from '../controllers/paymob_controller.js'
import wallet_model from '../models/wallet_model.js'
import subscription_model from '../models/subscription_model.js'
import notification_model from '../models/notification_model.js'
import { sendNotifications } from '../controllers/notification_controller.js'
import rider_model from '../models/rider_model.js'
import { appRadioCategoryId, isTaxiOrCaptainOrScooter, profileViewCategoryId } from '../controllers/ride_controller.js'
import axios from 'axios'

const router = express.Router()

router.get('/', verifyToken, async (req, res, next) => {

    try {
        const { language } = req.headers

        const result = await subscription_model.find({ user_id: req.user.id }).sort({ createdAt: -1, _id: 1 })

        if (result) {
            const categories = await sub_category_model.find({ _id: { $in: result.map(e => e.sub_category_id) } })

            for (const subscription of result) {
                for (const category of categories) {
                    if (subscription.sub_category_id == category.id) {
                        if (!subscription._doc.category) {

                            if (!category._doc.name) {

                                category._doc.name = language == 'ar' ? category.name_ar : category.name_en

                                delete category._doc.name_en
                                delete category._doc.name_ar
                            }
                            subscription._doc.category = category
                        }
                        break
                    }
                }
            }
        }

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/packages/:categoryId', tryVerify, async (req, res, next) => {

    try {
        const { language } = req.headers

        const result = await sub_category_model.findById(req.params.categoryId)

        if (!result) return next({ 'status': 404, 'message': language == 'ar' ? 'القسم غير موجود' : 'The Category is Not Exist' })

        var dailyPrice = result.daily_price
        var weeklyPrice = dailyPrice * 6
        var monthlyPrice = dailyPrice * 22
        var yearlyPrice = monthlyPrice * 11

        var isDoublePrice = true

        if (req.user) {
            const user = await user_model.findById(req.user.id).select('country_code')
            isDoublePrice = user.country_code != "EG"
            const rider = await rider_model.findOne({ user_id: req.user.id, category_id: req.params.categoryId, indebtedness: { $gt: 0 } }).select('indebtedness')

            if (rider) {
                dailyPrice += rider.indebtedness
                weeklyPrice += rider.indebtedness
                monthlyPrice += rider.indebtedness
                yearlyPrice += rider.indebtedness
            }
        }

        if (isDoublePrice) {
            dailyPrice = dailyPrice * 5
            weeklyPrice = weeklyPrice * 5
            monthlyPrice = monthlyPrice * 5
            yearlyPrice = yearlyPrice * 5
        }

        res.json({
            'status': true,
            'data': {
                'regular': [Math.round(dailyPrice), Math.round(weeklyPrice), Math.round(monthlyPrice), Math.round(yearlyPrice)],
                'premium': [Math.round(dailyPrice * 1.25), Math.round(weeklyPrice * 1.25), Math.round(monthlyPrice * 1.25), Math.round(yearlyPrice * 1.25)],
            }
        })

    } catch (e) {
        next(e)
    }
})

router.post('/card-subscribe', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { sub_category_id, days, is_premium, wallet_number } = req.body

        if (sub_category_id && (days == 1 || days == 7 || days == 30 || days == 365)) {

            const category = await sub_category_model.findById(sub_category_id).select('_id daily_price')

            if (!category) return next({ 'status': 404, 'message': language == 'ar' ? 'القسم غير موجود' : 'The Category is Not Exist' })

            if (category.daily_price == 0) return next({ 'status': 404, 'message': language == 'ar' ? 'هذا القسم مجانى' : 'This Sub Category is Free' })

            const user = await user_model.findById(req.user.id).select('_id phone_number first_name last_name email country_code')

            if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'المستخدم غير موجود' : 'User not found' })

            if (!(user._doc.phone_number ?? '').trim()) user._doc.phone_number = 'NA'
            if (!(user._doc.first_name ?? '').trim()) user._doc.first_name = 'NA'
            if (!(user._doc.last_name ?? '').trim()) user._doc.last_name = 'NA'
            if (!(user._doc.email ?? '').trim()) user._doc.email = 'NA'

            const dailyPrice = category.daily_price
            const weeklyPrice = dailyPrice * 6
            const monthlyPrice = dailyPrice * 22
            const yearlyPrice = monthlyPrice * 11

            var packagePrice = days == 1 ? dailyPrice : days == 7 ? weeklyPrice : days == 30 ? monthlyPrice : yearlyPrice

            const rider = await rider_model.findOne({ user_id: req.user.id, category_id: sub_category_id, indebtedness: { $gt: 0 } }).select('indebtedness')

            if (rider) {
                packagePrice += rider.indebtedness
            }


            if (is_premium == true) packagePrice = packagePrice * 1.25

            if (user.country_code != "EG") packagePrice = packagePrice * 5

            packagePrice = Math.round(packagePrice)

            const paymentToken = await getPaymobToken()
            const orderId = await makeOrder(paymentToken, packagePrice * 100)
            const iFrameToken = await paymentKeys(paymentToken, orderId, packagePrice * 100,
                {
                    'phone_number': user._doc.phone_number,
                    'first_name': user._doc.first_name,
                    'last_name': user._doc.last_name,
                    'email': user._doc.email,
                    'floor': 'NA',
                    'city': 'NA',
                    'building': 'NA',
                    'apartment': 'NA',
                    'street': "NA",
                    'postal_code': "NA",
                    'country': "NA",
                    'state': "NA",
                    'shipping_method': 'NA',
                    'extra_description': JSON.stringify({
                        'method_type': 'subscription',
                        'user_id': req.user.id,
                        'sub_category_id': sub_category_id,
                        'days': days,
                        'is_premium': is_premium == true,
                        'total': packagePrice,
                        'is_card': wallet_number.length == 0,
                    })
                },
                wallet_number.length == 0,
            )

            var url = `https://accept.paymob.com/api/acceptance/iframes/354120?payment_token=${iFrameToken}`

            if (wallet_number.length > 0) {
                
                url = await makeWalletOrder(iFrameToken, 
                    wallet_number.replace('٠', '0')
                    .replace('١', '1')
                    .replace('٢', '2')
                    .replace('٣', '3')
                    .replace('٤', '4')
                    .replace('٥', '5')
                    .replace('٦', '6')
                    .replace('٧', '7')
                    .replace('٨', '8')
                    .replace('٩', '9')                
                )
            }

            res.json({
                'status': true,
                'data': url
            })

        } else return next('Bad Request')


    } catch (e) {

        console.log(e)
        next(e)
    }
})

router.post('/wallet-subscribe', verifyToken, async (req, res, next) => {

    try {
        const { language } = req.headers

        const { sub_category_id, days } = req.body

        if (sub_category_id && (days == 1 || days == 7 || days == 30 || days == 365)) {

            const category = await sub_category_model.findById(sub_category_id).select('daily_price name_ar name_en')

            if (!category) return next({ 'status': 404, 'message': language == 'ar' ? 'القسم غير موجود' : 'The Category is Not Exist' })

            if (category.daily_price == 0) return next({ 'status': 404, 'message': language == 'ar' ? 'هذا القسم مجانى' : 'This Sub Category is Free' })

            const user = await user_model.findById(req.user.id).select('_id country_code')

            const wallet = await wallet_model.findOne({ user_id: req.user.id })

            if (!user || !wallet) return next({ 'status': 404, 'message': language == 'ar' ? 'المستخدم غير موجود' : 'User not found' })

            const dailyPrice = category.daily_price * 1.25
            const weeklyPrice = dailyPrice * 6
            const monthlyPrice = dailyPrice * 22
            const yearlyPrice = monthlyPrice * 11

            var packagePrice = days == 1 ? dailyPrice : days == 7 ? weeklyPrice : days == 30 ? monthlyPrice : yearlyPrice

            const rider = await rider_model.findOne({ user_id: req.user.id, category_id: sub_category_id, indebtedness: { $gt: 0 } }).select('indebtedness')

            if (rider) {
                packagePrice += rider.indebtedness
            }

            if (user.country_code != "EG") packagePrice = packagePrice * 5

            packagePrice = Math.round(packagePrice)


            if (wallet.balance < packagePrice) return next({ 'status': 400, 'message': language == 'ar' ? 'رصيدك ليس كافيا' : 'Your Balance is Not Enough' })

            await wallet_model.updateOne({ user_id: req.user.id }, { $inc: { balance: -packagePrice } })

            if (isTaxiOrCaptainOrScooter(sub_category_id)) {
                await subscription_model.updateOne({
                    user_id: req.user.id,
                    sub_category_id: sub_category_id,
                    is_premium: false,
                }, {
                    user_id: req.user.id,
                    sub_category_id: sub_category_id,
                    is_premium: false,
                    is_active: true,
                    $inc: { days: days }
                }, { upsert: true, new: true, setDefaultsOnInsert: true })

            } else {
                await subscription_model.updateOne({
                    user_id: req.user.id,
                    sub_category_id: sub_category_id,
                    is_premium: false,
                }, {
                    user_id: req.user.id,
                    sub_category_id: sub_category_id,
                    is_premium: false,
                    $inc: { days: days }
                }, { upsert: true, new: true, setDefaultsOnInsert: true })
            }

            if (sub_category_id == profileViewCategoryId || sub_category_id == appRadioCategoryId) {
                subscription_model.updateOne({
                    user_id: req.user.id,
                    sub_category_id,
                }, { is_active: true }).exec()
            }


            rider_model.updateOne({ user_id: req.user.id, category_id: sub_category_id }, { indebtedness: 0, free_ride: false }).exec()

            const titleAr = 'تم الاشتراك بنجاح'
            const titleEn = 'Subscribed Successfully'
            const subCategoryName = language == 'ar' ? category.name_ar : category.name_en

            const bodyAr = `تم الاشتراك بنجاح في ${subCategoryName} لمدة ${days} ايام`
            const bodyEn = `Successfully subscribed to ${subCategoryName} for ${days} days`

            const notification = new notification_model({
                receiver_id: req.user.id,
                tab: 3,
                text_ar: bodyAr,
                text_en: bodyEn,
                type: 1001,
            })

            await notification.save()

            const fcm = await auth_model.find({ user_id: req.user.id }).select('fcm').distinct('fcm')

            if (fcm) {
                sendNotifications(
                    fcm,
                    language == 'ar' ? titleAr : titleEn,
                    language == 'ar' ? bodyAr : bodyEn,
                    1001,
                )
            }

            axios.post(process.env.REAL_TIME_SERVER_URL + 'set-chat-enabled',
                {
                    user_id: req.user.id,
                    category_id: sub_category_id,
                },
                {
                    headers:
                    {
                        'Key': process.env.REAL_TIME_SERVER_KEY
                    },
                },
            )

            res.json({
                'status': true,
            })

        } else return next('Bad Request')
    } catch (e) {
        next(e)
    }
})

router.post('/start-counter', verifyToken, async (req, res, next) => {

    try {
        const { language } = req.headers

        const { sub_category_id, user_id } = req.body

        if (!sub_category_id || !user_id) return next('Bad Request')

        startSubscriptionCounter(sub_category_id, user_id, language)

        res.json({
            'status': true,
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

export const startSubscriptionCounter = (sub_category_id, user_id, language) => {

    Promise.all([
        sub_category_model.findById(sub_category_id).select('name_ar name_en'),
        subscription_model.findOneAndUpdate({
            sub_category_id, is_active: false, user_id
        }, {
            is_active: true,
        }),
    ]).then(r => {

        if (r[0]) {

            const titleAr = 'تم تفعيل اشتراكك'
            const titleEn = 'Your subscription has been activated'

            if (r[1]) {

                const object = new notification_model({
                    receiver_id: r[1].user_id,
                    tab: 3,
                    text_ar: `${titleAr} في ${r[0].name_ar}`,
                    text_en: `${titleEn} in ${r[0].name_en}`,
                    type: 1006,
                })
                object.save()

                auth_model.find({ user_id: r[1].user_id }).select('fcm').distinct('fcm').then(fcm => {
                    sendNotifications(
                        fcm,
                        language == 'ar' ? titleAr : titleEn,
                        language == 'ar' ? `${titleAr} في ${r[0].name_ar}` : `${titleEn} in ${r[0].name_en}`,
                        1006,
                    )
                })
            }
        }
    })
}
export default router