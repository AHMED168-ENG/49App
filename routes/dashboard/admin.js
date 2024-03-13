import express from 'express'

import mongoose from 'mongoose';
import dynamic_ad_model from '../../models/dynamic_ad_model.js';
import rider_model from '../../models/rider_model.js';
import loading_model from '../../models/loading_model.js';
import restaurant_model from '../../models/restaurant_model.js';
import doctor_model from '../../models/doctor_model.js';
import admin_model from '../../models/admin_model.js';
import dynamic_prop_model from '../../models/dynamic_prop_model.js'
import report_model from '../../models/report_model.js'
import sub_category_model from '../../models/sub_category_model.js'
import user_model from '../../models/user_model.js'
import auth_model from '../../models/auth_model.js'
import subscription_model from '../../models/subscription_model.js'
import notification_model from '../../models/notification_model.js'
import food_model from '../../models/food_model.js';
import main_category_model from '../../models/main_category_model.js';
import { verifyTokenAndAdmin, dynamicAdKeys, verifyTokenAndSuperAdminOrAdmin, baseUserKeys, comeWithMeTripKeys, pickMeTripKeys } from '../../helper.js'
import { sendNotifications } from '../../controllers/notification_controller.js'
import { foodCategoryId, healthCategoryId, loadingCategoryId, rideCategoryId, isTaxiOrCaptainOrScooter, comeWithYouCategoryId } from '../../controllers/ride_controller.js';
import message_model from '../../models/message_model.js';
import post_model from '../../models/post_model.js';
import patient_book_model from '../../models/patient_book_model.js';
import rating_model from '../../models/rating_model.js';
import food_order_model from '../../models/food_order_model.js';
import come_with_me_ride_model from '../../models/come_with_me_ride_model.js';
import pick_me_ride_model from '../../models/pick_me_ride_model.js';
import post_comment_model from '../../models/post_comment_model.js';



const router = express.Router()


router.get('/check', verifyTokenAndAdmin, async (req, res, next) => {

    try {

        const result = await admin_model.findById(req.user.id)

        res.json({
            'status': result != null,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/review-count', verifyTokenAndAdmin, async (req, res, next) => {

    try {

        const result = await Promise.all([
            dynamic_ad_model.find({ is_approved: false }).count(),
            rider_model.find({ is_approved: false }).count(),
            loading_model.find({ is_approved: false }).count(),
            restaurant_model.find({ is_approved: false }).count(),
            food_model.find({ is_approved: false }).count(),
            doctor_model.find({ is_approved: false }).count(),
            report_model.find({}).count(),
        ])

        res.json({
            'status': true,
            'data': {
                'ads': result[0],
                'ride': result[1],
                'loading': result[2],
                'restaurant': result[3],
                'food': result[4],
                'health': result[5],
                'report': result[6],
            }
        })
    } catch (e) {
        next(e)
    }
})

router.get('/review-ads', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { page } = req.query

        const result = await dynamic_ad_model.find({
            is_approved: false,
        }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20)
            .select(dynamicAdKeys)

        if (!result) return res.json({
            'status': true,
            'data': [],
        })


        const subCategoryIds = []
        const usersIds = []

        result.forEach(ad => {
            if (!usersIds.includes(ad.user_id)) usersIds.push(ad.user_id)
            if (!subCategoryIds.includes(ad.sub_category_id)) subCategoryIds.push(ad.sub_category_id)
        })

        const users = await user_model.find({ _id: { $in: usersIds } }).select('_id first_name last_name profile_picture phone')

        const subscriptions = await subscription_model.find({ sub_category_id: { $in: subCategoryIds }, user_id: { $in: usersIds } }).distinct('user_id')

        const props = await dynamic_prop_model.find({ sub_category_id: { $in: subCategoryIds } })

        result.forEach(ad => {

            ad._doc.is_favorite = false
            ad._doc.is_subscription = subscriptions.includes(ad.user_id)

            ad.props.forEach(adProp => {
                for (const prop of props) {
                    if (prop.id == adProp.id) {
                        adProp._id = adProp.id
                        adProp.name = prop.name_en
                        adProp.selections = prop.selections
                        delete adProp.id
                        break
                    }
                }
            })

            for (const user of users) {
                if (ad.user_id == user.id) {
                    ad._doc.user = user
                    break
                }
            }
            ad.props = ad.props.filter(e => e.name)
        })

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/approve-ad', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id, pictures } = req.body

        if (!id || !pictures) return next('Bad Request')

        const result = await dynamic_ad_model.findOneAndUpdate({ _id: id, is_approved: false }, { is_approved: true, pictures }).select('user_id')

        if (result) {

            const user = await user_model.findOneAndUpdate({ _id: result.user_id }, { is_merchant: true }).select('language')

            if (user) {

                const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

                const title_ar = `قبول الاعلان`
                const title_en = 'Approved Ad'
                const body_ar = 'تم قبول اعلانك'
                const body_en = 'Your Ad has been Approved'

                const object = new notification_model({
                    receiver_id: result.user_id,
                    user_id: 0,
                    tab: 3,
                    text_ar: body_ar,
                    text_en: body_en,
                    title_ar,
                    title_en,
                    type: 1002,
                    direction: result.id,
                })

                object.save()

                if (fcm) {
                    sendNotifications(fcm, user.language == 'ar' ? title_ar : title_en, user.language == 'ar' ? body_ar : body_en, 1002)
                }
            }
        }
        res.json({ 'status': true })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/decline-ad', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id, reason_ar, reason_en } = req.body

        if (!id) return next('Bad Request')

        const result = await dynamic_ad_model.findOneAndDelete({ _id: id }).select('user_id')

        const user = await user_model.findById(result.user_id).select('language')

        if (result && user) {

            const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

            const title_ar = `رفض الاعلان`
            const title_en = 'Decline Ad'
            var body_ar = 'تم رفض اعلانك'
            var body_en = 'Your Ad has been Declined'

            if (reason_ar) {
                body_ar += `\n${reason_ar}`
            }

            if (reason_en) {
                body_en += `\n${reason_en}`
            }

            const object = new notification_model({
                receiver_id: result.user_id,
                user_id: 0,
                tab: 3,
                text_ar: body_ar,
                text_en: body_en,
                title_ar,
                title_en,
                type: 0,
            })

            object.save()

            if (fcm) {
                sendNotifications(fcm, user.language == 'ar' ? title_ar : title_en, user.language == 'ar' ? body_ar : body_en)
            }
        }
        res.json({ 'status': true })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/review-riders', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const riders = await rider_model.find({ is_approved: false }).skip((((page ?? 1) - 1) * 20)).limit(20)

        if (riders) {

            const users = await user_model.find({ _id: { $in: riders.map(e => e.user_id) } }).select('_id first_name last_name profile_picture')

            const categoryIds = []

            for (const rider of riders) {
                if (!categoryIds.includes(rider.category_id)) categoryIds.push(rider.category_id)
            }

            const categories = await sub_category_model.find({ _id: { $in: categoryIds } })

            for (const rider of riders) {

                for (const category of categories) {
                    if (category.id == rider.category_id) {
                        category._doc.name = language == 'ar' ? category.name_ar : category.name_en
                        category._doc.total = 0
                        category._doc.is_favorite = false
                        rider._doc.category = category
                        break
                    }
                }
                for (const user of users) {
                    if (user.id == rider.user_id) {
                        rider._doc.user = user
                        break
                    }
                }
            }
        }
        res.json({ 'status': true, 'data': riders })

    } catch (e) {
        next(e)
    }
})

router.post('/approve-rider', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id, car_brand, car_type, car_plate_letters, car_plate_numbers } = req.body

        if (!id || !car_brand || !car_type || !car_plate_letters || !car_plate_numbers) return next('Bad Request')


        const result = await rider_model.findOneAndUpdate({ _id: id, is_approved: false }, { car_brand, car_type, car_plate_letters, car_plate_numbers, is_approved: true }).select('user_id category_id')

        const user = await user_model.findById(result.user_id).select('language')

        if (result && user) {

            const subCategory = await sub_category_model.findById(result.category_id).select('name_ar name_en')

            const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

            const title_ar = `قبول طلبك`
            const title_en = 'Your Registration Approved'
            var body_ar = `تم قبول طلب تسجيلك فى ${subCategory.name_ar}`
            var body_en = `Your Registration Approved In ${subCategory.name_en}`

            if (isTaxiOrCaptainOrScooter(result.category_id)) {

                body_ar = `تم قبول طلب تسجيلك فى ${subCategory.name_ar} الرجاء تعيين نفسك كمتاح لاستقبال رحلات جديدة`
                body_en = `Your Registration Approved In ${subCategory.name_en} Please set Your Account is available to receive new rides`
            }
            const object = new notification_model({
                receiver_id: result.user_id,
                user_id: 0,
                tab: 3,
                text_ar: body_ar,
                text_en: body_en,
                title_ar,
                title_en,
                type: 1004,
                direction: rideCategoryId,
            })

            object.save()

            if (fcm) {
                sendNotifications(fcm, user.language == 'ar' ? title_ar : title_en, user.language == 'ar' ? body_ar : body_en, 1004, rideCategoryId)
            }
        }
        res.json({ 'status': true })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/decline-rider', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id, reason_ar, reason_en } = req.body

        if (!id) return next('Bad Request')

        const result = await rider_model.findOneAndDelete({ _id: id }).select('user_id').select('user_id category_id')

        const user = await user_model.findById(result.user_id).select('language')

        if (result && user) {

            const subCategory = await sub_category_model.findById(result.category_id).select('name_ar name_en')

            const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

            const title_ar = `رفض طلبك`
            const title_en = 'Your Registration Declined'
            var body_ar = `تم رفض طلب تسجيلك فى ${subCategory.name_ar}`
            var body_en = `Your Registration Declined In ${subCategory.name_en}`

            if (reason_ar) {
                body_ar += `\n${reason_ar}`
            }

            if (reason_en) {
                body_en += `\n${reason_en}`
            }

            const object = new notification_model({
                receiver_id: result.user_id,
                user_id: 0,
                tab: 3,
                text_ar: body_ar,
                text_en: body_en,
                title_ar,
                title_en,
                type: 0,
            })

            object.save()

            if (fcm) {
                sendNotifications(fcm, user.language == 'ar' ? title_ar : title_en, user.language == 'ar' ? body_ar : body_en, 0)
            }
        }
        res.json({ 'status': true })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/review-loading', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const riders = await loading_model.find({ is_approved: false }).skip((((page ?? 1) - 1) * 20)).limit(20)

        if (riders) {

            const users = await user_model.find({ _id: { $in: riders.map(e => e.user_id) } }).select('_id first_name last_name profile_picture')

            const categoryIds = []

            for (const rider of riders) {
                if (!categoryIds.includes(rider.category_id)) categoryIds.push(rider.category_id)
            }

            const categories = await sub_category_model.find({ _id: { $in: categoryIds } })

            for (const rider of riders) {

                for (const category of categories) {
                    if (category.id == rider.category_id) {
                        category._doc.name = language == 'ar' ? category.name_ar : category.name_en
                        category._doc.total = 0
                        category._doc.is_favorite = false
                        rider._doc.category = category
                        break
                    }
                }
                for (const user of users) {
                    if (user.id == rider.user_id) {
                        rider._doc.user = user
                        break
                    }
                }
            }
        }
        res.json({ 'status': true, 'data': riders })

    } catch (e) {
        next(e)
    }
})

router.post('/approve-loading', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id, car_brand, car_type, location } = req.body

        if (!id || !car_brand || !car_type || !location) return next('Bad Request')


        const result = await loading_model.findOneAndUpdate({ _id: id, is_approved: false }, { car_brand, car_type, location, is_approved: true }).select('user_id category_id')

        const user = await user_model.findById(result.user_id).select('language')

        if (result && user) {

            const subCategory = await sub_category_model.findById(result.category_id).select('name_ar name_en')

            const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

            const title_ar = `قبول طلبك`
            const title_en = 'Your Registration Approved'
            const body_ar = `تم قبول طلب تسجيلك فى ${subCategory.name_ar}`
            const body_en = `Your Registration Approved In ${subCategory.name_en}`

            const object = new notification_model({
                receiver_id: result.user_id,
                user_id: 0,
                tab: 3,
                text_ar: body_ar,
                text_en: body_en,
                title_ar,
                title_en,
                type: 1004,
                direction: loadingCategoryId,
            })

            object.save()

            if (fcm) {
                sendNotifications(fcm, user.language == 'ar' ? title_ar : title_en, user.language == 'ar' ? body_ar : body_en, 1004, loadingCategoryId)
            }
        }
        res.json({ 'status': true })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/decline-loading', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id, reason_ar, reason_en } = req.body

        if (!id) return next('Bad Request')

        const result = await loading_model.findOneAndDelete({ _id: id }).select('user_id').select('user_id category_id')

        const user = await user_model.findById(result.user_id).select('language')

        if (result && user) {

            const subCategory = await sub_category_model.findById(result.category_id).select('name_ar name_en')

            const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

            const title_ar = `رفض طلبك`
            const title_en = 'Your Registration Declined'
            var body_ar = `تم رفض طلب تسجيلك فى ${subCategory.name_ar}`
            var body_en = `Your Registration Declined In ${subCategory.name_en}`

            if (reason_ar) {
                body_ar += `\n${reason_ar}`
            }

            if (reason_en) {
                body_en += `\n${reason_en}`
            }

            const object = new notification_model({
                receiver_id: result.user_id,
                user_id: 0,
                tab: 3,
                text_ar: body_ar,
                text_en: body_en,
                title_ar,
                title_en,
                type: 0,
            })

            object.save()

            if (fcm) {
                sendNotifications(fcm, user.language == 'ar' ? title_ar : title_en, user.language == 'ar' ? body_ar : body_en, 0)
            }
        }
        res.json({ 'status': true })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/review-restaurant', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const riders = await restaurant_model.find({ is_approved: false }).skip((((page ?? 1) - 1) * 20)).limit(20)

        if (riders) {

            const users = await user_model.find({ _id: { $in: riders.map(e => e.user_id) } }).select('_id first_name last_name profile_picture')

            const categoryIds = []

            for (const rider of riders) {
                if (!categoryIds.includes(rider.category_id)) categoryIds.push(rider.category_id)
            }

            const categories = await sub_category_model.find({ _id: { $in: categoryIds } })

            for (const rider of riders) {

                for (const category of categories) {
                    if (category.id == rider.category_id) {
                        category._doc.name = language == 'ar' ? category.name_ar : category.name_en
                        category._doc.total = 0
                        category._doc.is_favorite = false
                        rider._doc.category = category
                        break
                    }
                }
                for (const user of users) {
                    if (user.id == rider.user_id) {
                        rider._doc.user = user
                        break
                    }
                }
            }
        }
        res.json({ 'status': true, 'data': riders })

    } catch (e) {
        next(e)
    }
})

router.post('/approve-restaurant', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id, location } = req.body

        if (!id || !location) return next('Bad Request')


        const result = await restaurant_model.findOneAndUpdate({ _id: id, is_approved: false }, { location, is_approved: true }).select('user_id category_id')

        const user = await user_model.findById(result.user_id).select('language')

        if (result && user) {

            const subCategory = await sub_category_model.findById(result.category_id).select('name_ar name_en')

            const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

            const title_ar = `قبول طلبك`
            const title_en = 'Your Registration Approved'
            const body_ar = `تم قبول طلب تسجيلك فى ${subCategory.name_ar}`
            const body_en = `Your Registration Approved In ${subCategory.name_en}`

            const object = new notification_model({
                receiver_id: result.user_id,
                user_id: 0,
                tab: 3,
                text_ar: body_ar,
                text_en: body_en,
                title_ar,
                title_en,
                type: 1004,
                direction: foodCategoryId,
            })

            object.save()

            if (fcm) {
                sendNotifications(fcm, user.language == 'ar' ? title_ar : title_en, user.language == 'ar' ? body_ar : body_en, 1004, foodCategoryId)
            }
        }
        res.json({ 'status': true })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/decline-restaurant', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id, reason_ar, reason_en } = req.body

        if (!id) return next('Bad Request')

        const result = await restaurant_model.findOneAndDelete({ _id: id }).select('user_id').select('user_id category_id')

        const user = await user_model.findById(result.user_id).select('language')

        if (result && user) {

            const subCategory = await sub_category_model.findById(result.category_id).select('name_ar name_en')

            const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

            const title_ar = `رفض طلبك`
            const title_en = 'Your Registration Declined'
            var body_ar = `تم رفض طلب تسجيلك فى ${subCategory.name_ar}`
            var body_en = `Your Registration Declined In ${subCategory.name_en}`

            if (reason_ar) {
                body_ar += `\n${reason_ar}`
            }

            if (reason_en) {
                body_en += `\n${reason_en}`
            }

            const object = new notification_model({
                receiver_id: result.user_id,
                user_id: 0,
                tab: 3,
                text_ar: body_ar,
                text_en: body_en,
                title_ar,
                title_en,
                type: 0,
            })

            object.save()

            if (fcm) {
                sendNotifications(fcm, user.language == 'ar' ? title_ar : title_en, user.language == 'ar' ? body_ar : body_en, 0)
            }
        }
        res.json({ 'status': true })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/review-health', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const riders = await doctor_model.find({ is_approved: false }).skip((((page ?? 1) - 1) * 20)).limit(20)

        if (riders) {

            const users = await user_model.find({ _id: { $in: riders.map(e => e.user_id) } }).select('_id first_name last_name profile_picture')

            const categoryIds = []

            for (const rider of riders) {
                if (!categoryIds.includes(rider.category_id)) categoryIds.push(rider.category_id)
            }

            const categories = await sub_category_model.find({ _id: { $in: categoryIds } })

            for (const rider of riders) {

                for (const category of categories) {
                    if (category.id == rider.category_id) {
                        category._doc.name = language == 'ar' ? category.name_ar : category.name_en
                        category._doc.total = 0
                        category._doc.is_favorite = false
                        rider._doc.category = category
                        break
                    }
                }
                for (const user of users) {
                    if (user.id == rider.user_id) {
                        rider._doc.user = user
                        break
                    }
                }
            }
        }
        res.json({ 'status': true, 'data': riders })

    } catch (e) {
        next(e)
    }
})

router.post('/approve-health', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id, location, specialty } = req.body

        if (!id || !location || !specialty) return next('Bad Request')


        const result = await doctor_model.findOneAndUpdate({ _id: id, is_approved: false }, { location, specialty, is_approved: true }).select('user_id category_id')

        const user = await user_model.findById(result.user_id).select('language')

        if (result && user) {

            const subCategory = await sub_category_model.findById(result.category_id).select('name_ar name_en')

            const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

            const title_ar = `قبول طلبك`
            const title_en = 'Your Registration Approved'
            const body_ar = `تم قبول طلب تسجيلك فى ${subCategory.name_ar}`
            const body_en = `Your Registration Approved In ${subCategory.name_en}`

            const object = new notification_model({
                receiver_id: result.user_id,
                user_id: 0,
                tab: 3,
                text_ar: body_ar,
                text_en: body_en,
                title_ar,
                title_en,
                type: 1004,
                direction: healthCategoryId,
            })

            object.save()

            if (fcm) {
                sendNotifications(fcm, user.language == 'ar' ? title_ar : title_en, user.language == 'ar' ? body_ar : body_en, 1004, healthCategoryId)
            }
        }
        res.json({ 'status': true })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/decline-health', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id, reason_ar, reason_en } = req.body

        if (!id) return next('Bad Request')

        const result = await doctor_model.findOneAndDelete({ _id: id }).select('user_id').select('user_id category_id')

        const user = await user_model.findById(result.user_id).select('language')

        if (result && user) {

            const subCategory = await sub_category_model.findById(result.category_id).select('name_ar name_en')

            const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

            const title_ar = `رفض طلبك`
            const title_en = 'Your Registration Declined'
            var body_ar = `تم رفض طلب تسجيلك فى ${subCategory.name_ar}`
            var body_en = `Your Registration Declined In ${subCategory.name_en}`

            if (reason_ar) {
                body_ar += `\n${reason_ar}`
            }

            if (reason_en) {
                body_en += `\n${reason_en}`
            }

            const object = new notification_model({
                receiver_id: result.user_id,
                user_id: 0,
                tab: 3,
                text_ar: body_ar,
                text_en: body_en,
                title_ar,
                title_en,
                type: 0,
            })

            object.save()

            if (fcm) {
                sendNotifications(fcm, user.language == 'ar' ? title_ar : title_en, user.language == 'ar' ? body_ar : body_en, 0)
            }
        }
        res.json({ 'status': true })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/review-food', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { page } = req.query

        const foods = await food_model.find({ is_approved: false }).skip((((page ?? 1) - 1) * 20)).limit(20)

        if (foods) {

            const restaurantIds = []

            for (const food of foods) {
                if (!restaurantIds.includes(food.restaurant_id)) restaurantIds.push(food.restaurant_id)
            }

            const restaurants = await restaurant_model.find({ user_id: { $in: restaurantIds } }).select('_id name user_id')

            for (const food of foods) {

                for (const restaurant of restaurants) {
                    if (food.restaurant_id == restaurant.user_id) {
                        food._doc.restaurant_name = restaurant.name
                        break
                    }
                }
            }
        }

        res.json({ 'status': true, 'data': foods })

    } catch (e) {
        next(e)
    }
})

router.post('/approve-food', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id, name, desc } = req.body

        if (!id || !name || !desc) return next('Bad Request')

        await food_model.updateOne({ id_: id, is_approved: false }, { name, desc, is_approved: true })

        res.json({ 'status': true })

    } catch (e) {
        next(e)
    }
})

router.post('/decline-food', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id } = req.body

        if (!id) return next('Bad Request')

        await food_model.deleteOne({ _id: id })

        res.json({ 'status': true })

    } catch (e) {
        next(e)
    }
})

router.post('/approve-health', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id, location, specialty } = req.body

        if (!id || !location || !specialty) return next('Bad Request')


        const result = await doctor_model.findOneAndUpdate({ _id: id, is_approved: false }, { location, specialty, is_approved: true }).select('user_id category_id')

        const user = await user_model.findById(result.user_id).select('language')

        if (result && user) {

            const subCategory = await sub_category_model.findById(result.category_id).select('name_ar name_en')

            const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

            const title_ar = `قبول طلبك`
            const title_en = 'Your Registration Approved'
            const body_ar = `تم قبول طلب تسجيلك فى ${subCategory.name_ar}`
            const body_en = `Your Registration Approved In ${subCategory.name_en}`

            const object = new notification_model({
                receiver_id: result.user_id,
                user_id: 0,
                tab: 3,
                text_ar: body_ar,
                text_en: body_en,
                title_ar,
                title_en,
                type: 0,
            })

            object.save()

            if (fcm) {
                sendNotifications(fcm, user.language == 'ar' ? title_ar : title_en, user.language == 'ar' ? body_ar : body_en, 0)
            }
        }
        res.json({ 'status': true })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/decline-health', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id, reason_ar, reason_en } = req.body

        if (!id) return next('Bad Request')

        const result = await doctor_model.findOneAndDelete({ _id: id }).select('user_id').select('user_id category_id')

        const user = await user_model.findById(result.user_id).select('language')

        if (result && user) {

            const subCategory = await sub_category_model.findById(result.category_id).select('name_ar name_en')

            const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

            const title_ar = `رفض طلبك`
            const title_en = 'Your Registration Declined'
            var body_ar = `تم رفض طلب تسجيلك فى ${subCategory.name_ar}`
            var body_en = `Your Registration Declined In ${subCategory.name_en}`

            if (reason_ar) {
                body_ar += `\n${reason_ar}`
            }

            if (reason_en) {
                body_en += `\n${reason_en}`
            }

            const object = new notification_model({
                reciereceiver_idver_id: result.user_id,
                user_id: 0,
                tab: 3,
                text_ar: body_ar,
                text_en: body_en,
                title_ar,
                title_en,
                type: 0,
            })

            object.save()

            if (fcm) {
                sendNotifications(fcm, user.language == 'ar' ? title_ar : title_en, user.language == 'ar' ? body_ar : body_en, 0)
            }
        }
        res.json({ 'status': true })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/main-categories', verifyTokenAndAdmin, async (req, res, next) => {

    try {

        const result = await main_category_model.find({})

        res.json({
            'status': true,
            'data': result,
        })
    } catch (e) {
        next(e)
    }
})

router.put('/main-categories', verifyTokenAndAdmin, async (req, res, next) => {

    try {

        const { id, name_ar, name_en, banner, cover } = req.body

        await main_category_model.updateOne({ _id: id }, { name_ar, name_en, banner, cover })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/sub-categories/:mainCategory', verifyTokenAndAdmin, async (req, res, next) => {

    try {

        const result = await sub_category_model.find({ parent: req.params.mainCategory })

        const allProps = await dynamic_prop_model.find({ sub_category_id: result.map(e => e.id) })

        for (const category of result) {
            category._doc.props = []
            for (const props of allProps) {
                if (props.sub_category_id == category.id) {
                    category._doc.props.push(props)
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

router.put('/sub-categories', verifyTokenAndAdmin, async (req, res, next) => {

    try {

        const { id, name_ar, name_en, picture } = req.body

        await sub_category_model.updateOne({ _id: id }, { name_ar, name_en, picture })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.put('/dynamic-props', verifyTokenAndAdmin, async (req, res, next) => {

    try {

        const { category_id, props } = req.body

        if (!category_id) return next('Bad Request')

        await dynamic_prop_model.deleteMany({ sub_category_id: category_id })

        if (props) {
            props.forEach(e => {
                e.sub_category_id = category_id
                if (!e._id) delete e._id
                else e._id = mongoose.Types.ObjectId(e._id)
            })
            await dynamic_prop_model.insertMany(props)
        }

        const result = await dynamic_prop_model.find({ sub_category_id: category_id })

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/users', verifyTokenAndAdmin, async (req, res, next) => {

    try {

        const { page } = req.query

        const users = await user_model.find({}).skip((((page ?? 1) - 1) * 20)).limit(20).select('_id first_name last_name phone profile_picture')


        res.json({
            'status': true,
            'data': users,
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/users-search', verifyTokenAndAdmin, async (req, res, next) => {

    try {

        const { data } = req.body

        if (!data) return next('Bad Request')

        var result = []

        const searchResult = await user_model.find(
            {
                $or: [
                    { first_name: { $regex: '.*' + data + '.*', $options: 'i' } },
                    { last_name: { $regex: '.*' + data + '.*', $options: 'i' } },
                    { email: { $regex: '.*' + data + '.*', $options: 'i' } },
                    { phone: { $regex: '.*' + data + '.*', $options: 'i' } }]
            }).limit(100).select('_id')

        if (searchResult.length > 0) {

            const ids = []
            searchResult.forEach(e => { if (!ids.includes(e.id)) ids.push(e.id) })

            result = await user_model.find({ _id: { $in: ids } }).select('_id first_name last_name phone profile_picture is_locked')
        }

        res.json({ 'status': true, 'data': result })

    } catch (e) {
        next(e)
    }
})

router.post('/send-notification', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { user_id, title_ar, title_en, body_ar, body_en } = req.body

        if (!user_id || !title_ar || !title_en || !body_ar || !body_en) return next('Bad Request')

        const user = await user_model.findById(user_id).select('_id language')

        if (!user) return next({ 'status': 404, 'messsage': 'No Found This User' })

        const fcm = await auth_model.findOne({ user_id }).distinct('fcm')

        const object = new notification_model({
            receiver_id: user_id,
            user_id: 0,
            tab: 3,
            text_ar: body_ar,
            text_en: body_en,
            title_ar,
            title_en,
            type: 0,
        })

        object.save()

        if (fcm) {
            sendNotifications(fcm, user.language == 'ar' ? title_ar : title_en, user.language == 'ar' ? body_ar : body_en)
        }
        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/send-notification-to-all', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { title_ar, title_en, body_ar, body_en } = req.body

        if (!title_ar || !title_en || !body_ar || !body_en) return next('Bad Request')

        res.json({
            'status': true,
        })

        var count = 0
        while (count != -1) {

            const users = await user_model.find({}).skip((count * 100)).limit(100).select('_id language')

            for (const user of users) {

                const object = new notification_model({
                    receiver_id: user.id,
                    user_id: 0,
                    tab: 3,
                    text_ar: body_ar,
                    text_en: body_en,
                    title_ar,
                    title_en,
                    type: 0,
                })

                object.save()

                auth_model.findOne({ user_id: user.id }).distinct('fcm').then(fcm => sendNotifications(fcm, user.language == 'ar' ? title_ar : title_en, user.language == 'ar' ? body_ar : body_en))

            }
            if (users.length == 100) count++
            else count = -1
        }
    } catch (e) {
        next(e)
    }
})

router.get('/reports-counts', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const result = await report_model.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } }, },
        ])

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/reports/:type', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {


        const { page } = req.query

        const result = await report_model.find({ type: req.params.type }).skip((((page ?? 1) - 1) * 20)).limit(20)

        if (result.length == 0) return res.json({ 'status': true, 'data': [] })

        const users = []

        result.forEach(e => {
            if (!users.includes(e.reporter_id)) users.push(e.reporter_id)
            if (!users.includes(e.user_id)) users.push(e.user_id)
        })

        const usersData = await user_model.find({ _id: { $in: users } }).select(baseUserKeys)

        result.forEach(e => {
            for (const user of usersData) {
                if (e.user_id == user.id) {
                    e._doc.user = user
                }
                if (e.reporter_id == user.id) {
                    e._doc.reporter = user
                }
            }
        })

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/get-reported-messages', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { ids } = req.body

        const result = await message_model.aggregate([
            { $match: { _id: { $in: ids.map(e => mongoose.Types.ObjectId(e)) } } }, {
                $project: {
                    total_sent: { $size: '$sent' },
                    total_seen: { $size: '$seen' },
                    contact_id: '$contact_id',
                    receiver_id: '$receiver_id',
                    text: '$text',
                    attachments: '$attachments',
                    date: '$createdAt',
                    type: '$type',
                    is_forward: '$is_forward',
                    replay_message: '$replay_message',
                }
            }])


        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/cancel-report/:id', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        await report_model.deleteOne({ _id: req.params.id })

        res.json({ 'status': true })

    } catch (e) {
        next(e)
    }
})

router.delete('/delete-post/:id', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {
    try {

        const result = await post_model.findOneAndDelete({ _id: req.params.id }).select('_id')

        if (result) {
            post_comment_model.deleteMany({ post_id: req.params.id }).exec()

            return res.json({ 'status': true })
        }
        res.json({ 'status': false, 'message': 'Can Not Found This Post' })

    } catch (e) { next(e) }
})

router.delete('/delete-dynamic-ad/:id', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {
    try {

        const result = await dynamic_ad_model.findOneAndDelete({ _id: req.params.id }).select('_id')

        if (result) {
            return res.json({ 'status': true })
        }
        res.json({ 'status': false, 'message': 'Can Not Found This Dynamic Ad' })

    } catch (e) { next(e) }
})

router.delete('/delete-restaurant/:id', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {
    try {

        const result = await restaurant_model.findOneAndDelete({ _id: req.params.id }).select('_id user_id category_id')

        if (result) {
            food_model.deleteMany({ restaurant_id: result.user_id }).exec()
            food_order_model.deleteMany({ restaurant_id: result.user_id }).exec()
            rating_model.deleteMany({ user_id: result.user_id, category_id: result.category_id }).exec()
            return res.json({ 'status': true })
        }
        res.json({ 'status': false, 'message': 'Can Not Found This Restaurant' })

    } catch (e) { next(e) }
})

router.delete('/delete-doctor/:id', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {
    try {

        const result = await doctor_model.findOneAndDelete({ _id: req.params.id }).select('_id user_id category_id')

        if (result) {
            patient_book_model.deleteMany({ doctor_id: result.user_id }).exec()
            rating_model.deleteMany({ user_id: req.user.id, category_id: result.category_id }).exec()
            user_model.updateOne({ _id: result.user_id }, { is_doctor: false }).exec()
            return res.json({ 'status': true })
        }
        res.json({ 'status': false, 'message': 'Can Not Found This Restaurant' })

    } catch (e) { next(e) }
})

router.get('/approve-come-with-me-trip/:id', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {
    try {

        const result = await come_with_me_ride_model.findOneAndUpdate({ _id: req.params.id, is_approved: false }, { is_approved: true }).select('_id')

        if (result) {
            return res.json({ 'status': true })
        }
        res.json({ 'status': false, 'message': 'Can Not Found This Trip' })

    } catch (e) { next(e) }
})

router.delete('/delete-come-with-me-trip/:id', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {
    try {

        const result = await come_with_me_ride_model.findOneAndDelete({ _id: req.params.id }).select('_id')

        if (result) {
            return res.json({ 'status': true })
        }
        res.json({ 'status': false, 'message': 'Can Not Found This Trip' })

    } catch (e) { next(e) }
})



router.get('/approve-pick-me-trip/:id', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {
    try {

        const result = await pick_me_ride_model.findOneAndUpdate({ _id: req.params.id, is_approved: false }, { is_approved: true }).select('_id')

        if (result) {
            return res.json({ 'status': true })
        }
        res.json({ 'status': false, 'message': 'Can Not Found This Trip' })

    } catch (e) { next(e) }
})

router.delete('/delete-pick-me-trip/:id', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {
    try {

        const result = await pick_me_ride_model.findOneAndDelete({ _id: req.params.id }).select('_id')

        if (result) {
            return res.json({ 'status': true })
        }
        res.json({ 'status': false, 'message': 'Can Not Found This Trip' })

    } catch (e) { next(e) }
})


router.post('/delete-chat-messages', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {
    try {

        const { ids } = req.body

        const result = await message_model.findOneAndDelete({ _id: { $in: ids } }).select('_id')

        if (result) {
            return res.json({ 'status': true })
        }
        res.json({ 'status': false, 'message': 'Can Not Found This Message' })

    } catch (e) { next(e) }
})


router.get('/get-come-with-me-trips', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {


        const { page } = req.query
        const result = await come_with_me_ride_model.find({ is_approved: true }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20).select(comeWithMeTripKeys)

        if (result.length > 0) {
            const usersIds = []

            result.forEach(e => {
                if (!usersIds.includes(e.user_id)) usersIds.push(e.user_id)
            })

            const subscriptions = await subscription_model.find({ sub_category_id: comeWithYouCategoryId, user_id: { $in: usersIds } }).distinct('user_id')

            const usersData = await user_model.find({ _id: { $in: usersIds } }).select(baseUserKeys)

            result.forEach(ad => {
                ad._doc.is_subscription = subscriptions.includes(ad.user_id) || subscriptions.includes(req.user.id)

                for (const user of usersData) {
                    if (user.id == ad.user_id) {
                        ad._doc.user = user
                        break;
                    }
                }
            })
        }
        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})


router.get('/get-review-come-with-me-trips', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {


        const { page } = req.query
        const result = await come_with_me_ride_model.find({ is_approved: false }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20).select(comeWithMeTripKeys)

        if (result.length > 0) {
            const usersIds = []

            result.forEach(e => {
                if (!usersIds.includes(e.user_id)) usersIds.push(e.user_id)
            })

            const subscriptions = await subscription_model.find({ sub_category_id: comeWithYouCategoryId, user_id: { $in: usersIds } }).distinct('user_id')

            const usersData = await user_model.find({ _id: { $in: usersIds } }).select(baseUserKeys)

            result.forEach(ad => {
                ad._doc.is_subscription = subscriptions.includes(ad.user_id) || subscriptions.includes(req.user.id)

                for (const user of usersData) {
                    if (user.id == ad.user_id) {
                        ad._doc.user = user
                        break;
                    }
                }
            })
        }
        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})


router.get('/get-pick-me-trips', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {


        const { page } = req.query
        const result = await pick_me_ride_model.find({ is_approved: true }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20).select(pickMeTripKeys)

        if (result.length > 0) {
            const usersIds = []

            result.forEach(e => {
                if (!usersIds.includes(e.user_id)) usersIds.push(e.user_id)
            })

            const subscriptions = await subscription_model.find({ sub_category_id: comeWithYouCategoryId, user_id: { $in: usersIds } }).distinct('user_id')

            const usersData = await user_model.find({ _id: { $in: usersIds } }).select(baseUserKeys)

            result.forEach(ad => {
                ad._doc.is_subscription = subscriptions.includes(ad.user_id) || subscriptions.includes(req.user.id)

                for (const user of usersData) {
                    if (user.id == ad.user_id) {
                        ad._doc.user = user
                        break;
                    }
                }
            })
        }
        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})


router.get('/get-review-pick-me-trips', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {


        const { page } = req.query
        const result = await pick_me_ride_model.find({ is_approved: false }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20).select(pickMeTripKeys)

        if (result.length > 0) {
            const usersIds = []

            result.forEach(e => {
                if (!usersIds.includes(e.user_id)) usersIds.push(e.user_id)
            })

            const subscriptions = await subscription_model.find({ sub_category_id: comeWithYouCategoryId, user_id: { $in: usersIds } }).distinct('user_id')

            const usersData = await user_model.find({ _id: { $in: usersIds } }).select(baseUserKeys)

            result.forEach(ad => {
                ad._doc.is_subscription = subscriptions.includes(ad.user_id) || subscriptions.includes(req.user.id)

                for (const user of usersData) {
                    if (user.id == ad.user_id) {
                        ad._doc.user = user
                        break;
                    }
                }
            })
        }
        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

export default router