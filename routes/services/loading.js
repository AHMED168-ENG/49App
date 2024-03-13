import express from 'express'
import loading_model from '../../models/loading_model.js';
import { verifyToken } from '../../helper.js'
import user_model from '../../models/user_model.js'
import sub_category_model from '../../models/sub_category_model.js'
import notification_model from '../../models/notification_model.js'
import auth_model from '../../models/auth_model.js'

import loading_trip_model from '../../models/loading_trip_model.js';
import rating_model from '../../models/rating_model.js';

import { loadingCategoryId } from '../../controllers/ride_controller.js';
import { sendNotifications } from '../../controllers/notification_controller.js';
import { requestCashBack } from '../../controllers/cash_back_controller.js';

const router = express.Router()

router.post('/register', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { car_brand, car_type, category_id, location, pictures, phone } = req.body

        const car_pictures = pictures.slice(0, 4)

        const id_front = pictures[4]
        const id_behind = pictures[5]

        const driving_license_front = pictures[6]
        const driving_license_behind = pictures[7]

        const car_license_front = pictures[8]
        const car_license_behind = pictures[9]


        const user = await user_model.findById(req.user.id).select('_id country_code')

        if (!user) return next({
            'status': 400,
            'message': language == 'ar' ? 'المستخدم غير موجود' : 'The User is Not Exist',
        })

        const result = await loading_model.findOne({ user_id: req.user.id })

        if (result) return next({
            'status': 400,
            'message': language == 'ar' ? 'لقد قمت بالتسجيل من قبل' : 'You already Registered Before',
        })

        if (!location ||
            !car_brand ||
            !car_type ||
            !category_id)
            return next('Bad Request')

        const object = new loading_model({
            user_id: req.user.id,
            car_pictures, id_front, id_behind, driving_license_front, driving_license_behind, car_license_front,
            car_license_behind,
            car_brand, car_type,
            category_id, location,
            country_code: user.country_code,
            phone,
        })

        await object.save()

        user_model.updateOne({ _id: req.user.id }, { is_loading: true }).exec()
        res.json({
            'status': true,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.delete('/delete-registration', verifyToken, async (req, res, next) => {

    try {

        const rider = await loading_model.findOneAndDelete({ user_id: req.user.id })

        if (rider) {
            await Promise.all([
                loading_trip_model.deleteMany({ rider_id: req.user.id }),
                rating_model.deleteMany({ user_id: req.user.id, category_id: rider.category_id }),
                user_model.updateOne({ _id: req.user.id }, { is_loading: false })
            ])
        }
        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-loading-trips', verifyToken, async (req, res, next) => {

    try {

        const { page } = req.query

        const result = await loading_trip_model.find({ rider_id: req.user.id, is_completed: true }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20)

        const ratings = await rating_model.find({ user_id: req.user.id, ad_id: { $in: result.map(e => e.id) } })

        for (const ride of result) {
            ride._doc.sub_category_name = ''
            for (const rating of ratings) {
                if (rating.ad_id == ride.id) {
                    ride._doc.rating = rating
                    break
                }
            }
        }

        res.json({ 'status': true, 'data': result })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/rating', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { field_one, field_two, field_three, comment, category_id, ad_id, user_id } = req.body

        if (!category_id || !ad_id || !user_id) return next('Bad Request')

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
            }

            else rider_model.updateOne({ user_id }, { rating: 5.0 }).exec()

            res.json({ 'status': true })

        } else return next('Bad Request')

    } catch (e) {
        next(e)
    }
})

router.delete('/delete-rating', verifyToken, async (req, res, next) => {

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

router.post('/new-loading-request', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { category_id, receipt_point, delivery_point, desc, price, time, phone } = req.body

        if (!category_id || !receipt_point || !delivery_point || !price || !time) return next('Bad Request')

        const user = await user_model.findById(req.user.id).select('country_code')

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على المستخدم' : 'The User is not Exist' })

        const category = await sub_category_model.findById(category_id).select('name_ar name_en')

        if (!category) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على القسم' : 'The Category is not Exist' })


        const object = new loading_trip_model({
            user_id: req.user.id,
            category_id,
            receipt_point,
            delivery_point, desc, price, time,
        })

        const loadingTrip = await object.save()


        const titleAr = 'طلب جديد'
        const titleEn = 'New Request'
        const bodyEn = `${category.name_en} Loading from ${receipt_point} to ${delivery_point} , Description ${desc}, Date ${time}, price offer ${price}`
        const bodyAr = `تحميلة ${category.name_ar} من ${receipt_point} الى ${delivery_point}, الوصف ${desc}, الميعاد ${time}, عرض سعر ${price}`

        var count = 0

        requestCashBack(req.user.id, language)

        while (count != -1) {

            const riders = await loading_model.find({
                is_active: true,
                is_approved: true,
                country_code: user.country_code,
                category_id,
                user_id: { $ne: req.user.id }
            }).skip((count * 100)).limit(100).select('user_id')


            for (const rider of riders) {

                const notificationObject = new notification_model({
                    receiver_id: rider.user_id,
                    user_id: req.user.id,
                    sub_category_id: category_id,
                    tab: 2,
                    text_ar: bodyAr,
                    text_en: bodyEn,
                    direction: loadingTrip.id,
                    main_category_id: loadingCategoryId,
                    type: 10004,
                    phone,
                })

                notificationObject.save()

                Promise.all([
                    user_model.findById(rider.user_id).select('language'),
                    auth_model.find({ 'user_id': rider.user_id }).distinct('fcm'),
                ]
                ).then(r => {
                    const user = r[0]
                    const fcm = r[1]
                    sendNotifications(fcm, user.language == 'ar' ? titleAr : titleEn, user.language == 'ar' ? bodyAr : bodyEn, 10004)
                })
            }

            if (riders.length == 100) count++
            else count = -1
        }
        res.json({
            'status': true,
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/send-loading-offer', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { adId, price } = req.body

        if (!adId || !price) return next('Bad Request')

        const user = await user_model.findById(req.user.id).select('first_name profile_picture')

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على السمتخدم' : 'The User is not Exist' })

        const ad = await loading_trip_model.findOne({ _id: adId, is_completed: false })

        if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الاعلان' : 'The Ad is not Exist' })

        const rider = await loading_model.findOne({ user_id: req.user.id, is_approved: true, is_active: true, category_id: ad.category_id })

        if (!rider) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على البيانات' : 'The Data is not Exist' })

        const titleAr = 'عرض سعر جديد'
        const titleEn = 'New Offer'
        const bodyEn = `New Offer (${ad.delivery_point}), From ${user.first_name}, price offer ${price}, rating ${rider.rating}`
        const bodyAr = `عرض جديد ${ad.delivery_point} ,من ${user.first_name},عرض السعر ${price}, التقييم ${rider.rating}`


        const notificationObject = new notification_model({
            receiver_id: ad.user_id,
            user_id: req.user.id,
            sub_category_id: ad.category_id,
            tab: 2,
            text_ar: bodyAr,
            text_en: bodyEn,
            direction: ad.id,
            main_category_id: loadingCategoryId,
            type: 10005,
            attachment: user.profile_picture,
            ad_owner: ad.user_id,
            request_price: price,
            phone: rider.phone,
        })

        notificationObject.save()

        Promise.all([
            user_model.findById(ad.user_id).select('language'),
            auth_model.find({ 'user_id': ad.user_id }).distinct('fcm'),
        ]
        ).then(r => {
            const user = r[0]
            const fcm = r[1]
            sendNotifications(fcm, user.language == 'ar' ? titleAr : titleEn, user.language == 'ar' ? bodyAr : bodyEn, 10005)
        })
        res.json({ 'status': true })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/accept-loading-offer', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { adId, notificationId } = req.body

        if (!adId || !notificationId) return next('Bad Request')

        const ad = await loading_trip_model.findOne({ _id: adId, user_id: req.user.id })

        if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الاعلان' : 'The Ad is not Exist' })

        if (ad.is_completed == true) return next({ 'status': 400, 'message': language == 'ar' ? 'الاعلان بالفعل مزود بمقدم خدمة' : 'The Ad is Already has service provider' })

        const notification = await notification_model.findOne({ _id: notificationId, receiver_id: req.user.id })

        if (!notification) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على العرض' : 'The Offer is not Exist' })

        const user = await user_model.findById(notification.user_id).select('_id language')

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على المستخدم' : 'The User is not Exist' })

        loading_trip_model.updateOne({ _id: ad.id }, { rider_id: user.id, is_completed: true, price: notification.request_price }).exec()

        loading_model.updateOne({ user_id: user.id }, { $inc: { profit: notification.request_price, trips: 1 } }).exec()


        const titleAr = 'تم قبول عرض السعر'
        const titleEn = 'The Price Offer Accepted'
        const bodyEn = `Price Offer ${notification.request_price} for Loading ${ad.delivery_point} is Accepted, you can contact the customer now `
        const bodyAr = `تم قبول عرض السعر ${notification.request_price} مقابل لرحلة ${ad.delivery_point} ، يمكنك الاتصال بالعميل الآن`

        await notification_model.deleteMany({ direction: ad.id }).exec()

        const notificationObject = new notification_model({
            receiver_id: user.id,
            user_id: req.user.id,
            sub_category_id: ad.category_id,
            tab: 2,
            text_ar: bodyAr,
            text_en: bodyEn,
            direction: ad.id,
            type: 10006,
            ad_owner: req.user.id,
            main_category_id: loadingCategoryId,

            is_accepted: true,
        })

        notificationObject.save()


        auth_model.find({ 'user_id': user.id }).distinct('fcm').then(
            fcm => sendNotifications(fcm, user.language == 'ar' ? titleAr : titleEn, user.language == 'ar' ? bodyAr : bodyEn, 10006))

        res.json({ 'status': true })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.delete('/delete-loading-request/:requestId', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const result = await loading_trip_model.findOneAndDelete({ _id: req.params.requestId, user_id: req.user.id, })

        if (!result) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الطلب' : 'The Request is not Exist' })

        if (result) {
            notification_model.deleteMany({
                direction: req.params.requestId,
            }).exec()
        }
        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-user-loadings', verifyToken, async (req, res, next) => {
    try {

        const { language } = req.headers

        const { page } = req.query

        const result = await loading_trip_model.find({ user_id: req.user.id, is_completed: true }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20)

        const riderIds = []
        const subCategoriesIds = []

        for (const ride of result) {
            if (!riderIds.includes(ride.rider_id))
                riderIds.push(ride.rider_id)
            if (!subCategoriesIds.includes(ride.category_id))
                subCategoriesIds.push(ride.category_id)
        }

        if (riderIds.length > 0) {

            const riders = await loading_model.find({ user_id: { $in: riderIds } })
            const ratings = await rating_model.find({ user_rating_id: req.user.id, ad_id: { $in: result.map(e => e.id) } })
            const users = await user_model.find({ _id: { $in: riderIds } }).select('first_name profile_picture')
            const categories = await sub_category_model.find({ _id: { $in: subCategoriesIds } }).select('_id name_ar name_en')

            for (const ride of result) {
                ride._doc.sub_category_name = ''

                for (const rider of riders) {
                    if (rider.user_id == ride.rider_id) {
                        ride._doc.rider_info = {
                            'id': rider.user_id,
                            'trips': rider.trips,
                            'name': '',
                            'picture': '',
                            'rating': rider.rating,
                            'car_brand': rider.car_brand,
                            'car_type': rider.car_type,
                        }
                        break
                    }
                }
                for (const user of users) {
                    if (user.id == ride.rider_id) {
                        if (ride._doc.rider_info) {
                            ride._doc.rider_info.name = user.first_name
                            ride._doc.rider_info.picture = user.profile_picture
                        }
                        break
                    }
                }
                for (const rating of ratings) {
                    if (rating.ad_id == ride.id) {
                        ride._doc.rating = rating
                        break
                    }
                }
                for (const category of categories) {
                    if (category.id == ride.category_id) {
                        ride._doc.sub_category_name = language == 'ar' ? category.name_ar : category.name_en
                        break
                    }
                }
            }
        }

        res.json({ 'status': true, 'data': result })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

export default router