import express from 'express'
import user_model from '../../models/user_model.js'
import dynamic_ad_model from '../../models/dynamic_ad_model.js'
import loading_model from '../../models/loading_model.js'
import doctor_model from '../../models/doctor_model.js'
import rider_model from '../../models/rider_model.js'
import restaurant_model from '../../models/restaurant_model.js'
import wallet_model from '../../models/wallet_model.js'
import app_manager_model from '../../models/app_manager_model.js'
import main_category_model from '../../models/main_category_model.js'
import sub_category_model from '../../models/sub_category_model.js'
import running_cost_model from '../../models/running_cost_model.js'
import auth_model from '../../models/auth_model.js'
import notification_model from '../../models/notification_model.js'
import admin_model from '../../models/admin_model.js'
import post_activity_model from '../../models/post_activity_model.js'
import app_radio_model from '../../models/app_radio_model.js'

import { baseUserKeys, decryptText, encryptText, verifyTokenAndSuperAdmin, dynamicAdKeys, verifyTokenAndSuperAdminOrAdmin, healthCategoryId } from '../../helper.js'
import { sendNotifications } from '../../controllers/notification_controller.js'
import gift_model from '../../models/gift_model.js'
import post_feeling_model from '../../models/post_feeling_model.js'
import song_model from '../../models/song_model.js'
import { appRadioCategoryId, foodCategoryId, profileViewCategoryId } from '../../controllers/ride_controller.js'
import post_model from '../../models/post_model.js'
import reel_model from '../../models/reel_model.js'
import call_log_model from '../../models/call_log_model.js.js'
import come_with_me_ride_model from '../../models/come_with_me_ride_model.js'
import comment_replay_model from '../../models/comment_replay_model.js'
import favorite_model from '../../models/favorite_model.js'
import food_model from '../../models/food_model.js'
import hidden_opinion_model from '../../models/hidden_opinion_model.js'
import loading_trip_model from '../../models/loading_trip_model.js'
import message_model from '../../models/message_model.js'
import patient_book_model from '../../models/patient_book_model.js'
import pick_me_ride_model from '../../models/pick_me_ride_model.js'
import post_comment_model from '../../models/post_comment_model.js'
import profile_view_model from '../../models/profile_view_model.js'
import rating_model from '../../models/rating_model.js'
import report_model from '../../models/report_model.js'
import ride_model from '../../models/ride_model.js'
import subscription_model from '../../models/subscription_model.js'
import contact_model from '../../models/contact_model.js'
import dynamic_prop_model from '../../models/dynamic_prop_model.js'
import food_order_model from '../../models/food_order_model.js'
import chat_group_model from '../../models/chat_group_model.js'
import monthly_contest_model from '../../models/monthly_contest_model.js'
import complaintـmodel from '../../models/complaintـmodel.js'

const router = express.Router()

router.post('/admins', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { name, username, password } = req.body

        if (!name || !username || !password) return next('Bad Request')

        req.body.password = encryptText(req.body.password)

        const object = new admin_model(req.body)

        const result = await object.save()

        result._doc.password = decryptText(result.password)

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/admins', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {
        const result = await admin_model.find({})

        for (const admin of result) {

            admin._doc.password = decryptText(admin.password)
        }

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/admins/:id', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        await admin_model.deleteOne({ _id: req.params.id })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/statistics', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { language } = req.headers

        const r = await Promise.all([
            user_model.find({}).count(),
            rider_model.find({}).count(),
            loading_model.find({}).count(),
            doctor_model.find({}).count(),
            restaurant_model.find({}).count(),
            dynamic_ad_model.find({}).count(),
            ride_model.find({}).count(),
            loading_trip_model.find({}).count(),
            food_order_model.find({}).count(),
            patient_book_model.find({}).count(),
        ])

        res.json({
            'status': true, 'data': {
                [(language == 'ar' ? 'اجمالي المستخدمين' : 'Total Users')]: r[0],
                [(language == 'ar' ? 'اجمالي المسجلين فى نوصيلة' : 'Total Registered In Ride')]: r[1],
                [(language == 'ar' ? 'اجمالي المسجلين فى تحميلة' : 'Total Registered In Loading')]: r[2],
                [(language == 'ar' ? 'اجمالي المسجلين فى صحة' : 'Total Registered In Health')]: r[3],
                [(language == 'ar' ? 'اجمالي المسجلين فى أكلة' : 'Total Registered In Food')]: r[4],
                [(language == 'ar' ? 'اجمالي الاعلانات الديناميك' : 'Total Dynamic Ads')]: r[5],
                [(language == 'ar' ? 'اجمالي رحلات توصيلة' : 'Total Rides')]: r[6],
                [(language == 'ar' ? 'اجمالي رحلات تحميلة' : 'Total Loadings')]: r[7],
                [(language == 'ar' ? 'اجمالي طلبات آكلة' : 'Total Food Orders')]: r[8],
                [(language == 'ar' ? 'اجمالي حجز صحة' : 'Total Patient Book')]: r[9],
            }
        }
        )
    } catch (e) {
        next(e)
    }
})

router.get('/users', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { page } = req.query

        const wallets = await wallet_model.find({}).sort({ 'balance': -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20)

        const users = await user_model.find({ _id: { $in: wallets.map((e) => e.user_id) } }).select('id first_name hash_code email provider last_name phone birth_date referral_id hash_code profile_picture cover_picture tender_picture country language social_status city job is_male is_locked locked_days currency privacy_country privacy_email privacy_phone privacy_birth_date privacy_social_status privacy_job privacy_city privacy_is_male privacy_language privacy_receive_messages privacy_last_seen privacy_friend_list privacy_follower_list privacy_activity privacy_random_appearance privacy_friend_request privacy_follow_request privacy_call')

        const referrals = await user_model.aggregate([
            {
                $match: {
                    'referral_id': { $in: users.map(e => e.id) },
                }
            },
            { $group: { _id: '$referral_id', total: { $sum: 1 } }, },
        ])

        for (const wallet of wallets) {
            for (const user of users) {
                for (const referralsUser of referrals) {
                    if (referralsUser._id == user.id) {
                        user._doc.referral_count = referralsUser.total
                    }
                }
                if (wallet.user_id == user.id) {
                    user._doc.wallet = wallet
                    break
                }
            }
        }

        const newList = []
        for (const wallet of wallets) {
            for (const user of users) {
                if (wallet.user_id == user.id) {
                    newList.push(user)
                    break
                }
            }
        }

        res.json({
            'status': true,
            'data': newList,
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.put('/users', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { id } = req.body

        if (!id) return next('Bad Request')

        const user = await user_model.findOneAndUpdate({ _id: id }, req.body, { returnOriginal: false }).select('id first_name provider email last_name phone birth_date referral_id hash_code profile_picture cover_picture tender_picture country language social_status city job is_male is_locked locked_days currency privacy_country privacy_email privacy_phone privacy_birth_date privacy_social_status privacy_job privacy_city privacy_is_male privacy_language privacy_receive_messages privacy_last_seen privacy_friend_list privacy_follower_list privacy_activity privacy_random_appearance privacy_friend_request privacy_follow_request privacy_call')
        const wallet = await wallet_model.findOneAndUpdate({ user_id: id }, req.body.wallet, { returnOriginal: false })


        user._doc.wallet = wallet

        res.json({
            'status': true,
            'data': user,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-referral-unique-count/:userId', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {


        const result = await user_model.find({
            referral_id: req.params.userId
        }).distinct('device_id')

        res.json({
            'status': true,
            'data': result.length,
        })
    } catch (e) {
        next(e)
    }
})

router.get('/get-referral-users/:userId', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { page } = req.query


        const result = await user_model.find({ referral_id: req.params.userId }).skip((((page ?? 1) - 1) * 20)).limit(20)
            .select('_id first_name last_name locked_days createdAt')

        res.json({
            'status': true,
            'data': result,
        })
    } catch (e) {
        next(e)
    }

})

router.delete('/users/:id', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        auth_model.deleteMany({ user_id: req.params.id }).exec()
        call_log_model.deleteMany({ $or: [{ user_id: req.params.id }, { caller_id: req.params.id }] }).exec()

        come_with_me_ride_model.deleteOne({ user_id: req.params.id }).exec()
        doctor_model.deleteOne({ user_id: req.params.id }).exec()
        loading_model.deleteOne({ user_id: req.params.id }).exec()
        restaurant_model.deleteOne({ user_id: req.params.id }).exec()
        loading_trip_model.deleteMany({ $or: [{ user_id: req.params.id }, { rider_id: req.params.id }] }).exec()
        ride_model.deleteMany({ $or: [{ user_id: req.params.id }, { rider_id: req.params.id }] }).exec()
        patient_book_model.deleteMany({ $or: [{ user_id: req.params.id }, { doctor_id: req.params.id }] }).exec()
        pick_me_ride_model.deleteMany({ user_id: req.params.id }).exec()

        comment_replay_model.deleteMany({ user_id: req.params.id }).exec()
        contact_model.deleteMany({ $or: [{ user_id: req.params.id }, { owner_id: req.params.id }] }).exec()
        dynamic_ad_model.deleteMany({ user_id: req.params.id }).exec()
        favorite_model.deleteMany({ user_id: req.params.id }).exec()
        food_model.deleteMany({ restaurant_id: req.params.id }).exec()
        hidden_opinion_model.deleteMany({ $or: [{ user_id: req.params.id }, { receiver_id: req.params.id }] }).exec()
        message_model.deleteMany({ type: 1, $or: [{ user_id: req.params.id }, { receiver_id: req.params.id }] }).exec() // private messages
        notification_model.deleteMany({ $or: [{ user_id: req.params.id }, { receiver_id: req.params.id }] }).exec()

        post_comment_model.deleteMany({ user_id: req.params.id }).exec()
        post_model.deleteMany({ user_id: req.params.id }).exec()
        profile_view_model.deleteMany({ $or: [{ user_id: req.params.id }, { owner_id: req.params.id }] }).exec()
        rating_model.deleteMany({ $or: [{ user_id: req.params.id }, { user_rating_id: req.params.id }] }).exec()
        reel_model.deleteMany({ user_id: req.params.id }, { user_rating_id: req.params.id }).exec()
        report_model.deleteMany({ $or: [{ user_id: req.params.id }, { reporter_id: req.params.id }] }).exec()
        song_model.deleteMany({ owner_id: req.params.id }).exec()
        subscription_model.deleteMany({ user_id: req.params.id }).exec()
        wallet_model.deleteOne({ user_id: req.params.id }).exec()
        user_model.deleteOne({ _id: req.params.id }).exec()

        user_model.updateMany({}, { $pull: { friends: req.params.id, friend_requests: req.params.id, followers: req.params.id, following: req.params.id, block: req.params.id } }).exec()

        post_model.updateMany({}, { $pull: { tags: req.params.id, likes: req.params.id, love: req.params.id, wow: req.params.id, sad: req.params.id, angry: req.params.id, shares: req.params.id } }).exec()

        message_model.updateMany({}, { $pull: { likes: req.params.id, love: req.params.id, wow: req.params.id, sad: req.params.id, angry: req.params.id } }).exec()

        food_order_model.deleteMany({ restaurant_id: req.params.id }).exec()
        food_order_model.deleteMany({ user_id: req.params.id }).exec()

        chat_group_model.deleteMany({ owner_id: req.params.id }).exec()
        contact_model.deleteMany({ owner_id: req.params.id }).exec()
        chat_group_model.updateMany({}, { $pull: { members: req.params.id, admins: req.params.id } }).exec()

        res.json({ 'status': true })
    } catch (e) {
        next(e)
    }
})

router.get('/app-manager', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const result = await app_manager_model.findOne({})

        res.json({
            'status': true,
            'data': result,
        })
    } catch (e) {
        next(e)
    }
})

router.put('/app-manager', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const result = await app_manager_model.findOneAndUpdate({}, req.body, { returnOriginal: false })

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.put('/app-manager', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const result = await app_manager_model.findOneAndUpdate({}, req.body, { returnOriginal: false })

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/main-categories', verifyTokenAndSuperAdmin, async (req, res, next) => {

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

router.get('/sub-categories/:mainCategory', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const result = await sub_category_model.find({ parent: req.params.mainCategory })

        res.json({
            'status': true,
            'data': result,
        })
    } catch (e) {
        next(e)
    }
})

router.post('/sub-categories', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {


        const lastCategory = await sub_category_model.findOne({ parent: req.body.parent }).sort({ index: -1, _id: 1 }).select('index')

        req.body.index = lastCategory ? lastCategory.index + 1 : 1

        const object = new sub_category_model(req.body)

        const result = await object.save()

        res.json({
            'status': true,
            'data': result
        })
    } catch (e) {
        next(e)
    }
})

router.put('/sub-categories/:categoryId', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        await sub_category_model.updateOne({ _id: req.params.categoryId }, req.body)

        res.json({
            'status': true,
        })
    } catch (e) {
        next(e)
    }
})

router.put('/sub-categories-indexes', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {


        const { ids, indexes } = req.body

        if (ids.length != indexes.length) return next('Bad Request')

        const promises = []
        for (var i = 0; i < ids.length; i++) {
            promises.push(sub_category_model.updateOne({ _id: ids[i] }, { index: indexes[i] }))
        }
        await Promise.all(promises)

        res.json({
            'status': true,
        })
    } catch (e) {
        next(e)
    }
})

router.delete('/sub-categories/:categoryId', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        await sub_category_model.deleteOne({ _id: req.params.categoryId })

        res.json({
            'status': true,
        })
    } catch (e) {
        next(e)
    }
})

router.get('/running-cost/:type', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { page } = req.query

        const result = await (req.params.type == 0 ? running_cost_model.find({})
            .sort({ createdAt: -1, _id: 1 })
            .skip((((page ?? 1) - 1) * 20))
            .limit(20) : running_cost_model.find({ type: req.params.type })
                .sort({ createdAt: -1, _id: 1 })
                .skip((((page ?? 1) - 1) * 20))
                .limit(20))

        res.json({
            'status': true,
            'data': result,
        })
    } catch (e) {
        next(e)
    }
})

router.post('/running-cost', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const object = new running_cost_model(req.body)

        const result = await object.save()

        res.json({
            'status': true,
            'data': result,
        })
    } catch (e) {
        next(e)
    }
})

router.delete('/running-cost/:id', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        await running_cost_model.deleteOne({ _id: req.params.id })

        res.json({
            'status': true,
        })
    } catch (e) {
        next(e)
    }
})

router.post('/send-notification', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { user_id, title_ar, title_en, body_ar, body_en } = req.body

        if (!user_id || !title_ar || !title_en || !body_ar || !body_en) return next('Bad Request')

        const user = await user_model.findById(user_id).select('_id language')

        if (!user) return next({ 'status': 404, 'message': 'No Found This User' })

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

router.post('/send-notification-to-all', verifyTokenAndSuperAdmin, async (req, res, next) => {

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

router.post('/users-search', verifyTokenAndSuperAdmin, async (req, res, next) => {

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
                    { phone: { $regex: '.*' + data + '.*', $options: 'i' } },
                ]
            }).limit(100).select('_id')

        if (searchResult.length > 0) {

            const ids = []
            searchResult.forEach(e => { if (!ids.includes(e.id)) ids.push(e.id) })

            result = await user_model.find({ _id: { $in: ids } }).select('id first_name provider email last_name phone birth_date referral_id hash_code profile_picture cover_picture tender_picture country language social_status city job is_male is_locked locked_days currency privacy_country privacy_email privacy_phone privacy_birth_date privacy_social_status privacy_job privacy_city privacy_is_male privacy_language privacy_receive_messages privacy_last_seen privacy_friend_list privacy_follower_list privacy_activity privacy_random_appearance privacy_friend_request privacy_follow_request privacy_call')

            const wallets = await wallet_model.find({ user_id: { $in: ids } })

            for (const user of result) {

                for (const wallet of wallets) {
                    if (wallet.user_id == user.id) {
                        user._doc.wallet = wallet
                        break
                    }
                }
            }
        }
        res.json({ 'status': true, 'data': result })

    } catch (e) {
        next(e)
    }
})

router.post('/lock-user', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { user_id, days } = req.body

        if (!user_id || !days) return next('Bad Request')

        const user = await user_model.findByIdAndUpdate({ _id: user_id }, { is_locked: true, $inc: { locked_days: days } }).select('_id language')

        if (!user) return next({ 'status': true, 'message': 'User Not Found' })

        const fcm = await auth_model.findOne({ user_id }).distinct('fcm')

        const title_ar = 'لقد تم حظر حسابك'
        const title_en = 'Your Account Is Blocked'
        const body_ar = `لقد تم حظر حسابك لمدة ${days} يوم`
        const body_en = `Your Account Bloced For ${days} Days`

        const object = new notification_model({
            receiver_id: user_id,
            user_id: 0,
            tab: 3,
            text_ar: title_ar,
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

router.post('/unlock-user', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { user_id } = req.body

        if (!user_id) return next('Bad Request')

        const user = await user_model.findByIdAndUpdate({ _id: user_id }, { is_locked: false, locked_days: 0 }).select('_id language')

        if (!user) return next({ 'status': true, 'message': 'User Not Found' })

        const fcm = await auth_model.findOne({ user_id }).distinct('fcm')

        const title_ar = 'لقد تم الغاء حظر حسابك'
        const title_en = 'Your Account Is Un Blocked'
        const body_ar = `لم تم الغاء حظر حسابك`
        const body_en = `Your Account is Un Blocked`

        const object = new notification_model({
            receiver_id: user_id,
            user_id: 0,
            tab: 3,
            text_ar: title_ar,
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


router.post('/give-user-subscription', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { user_id, category_id, days, is_premium } = req.body

        if (!user_id || !category_id || !days) return next('Bad Request')

        const user = await user_model.findByIdAndUpdate({ _id: user_id }, { is_locked: false, locked_days: 0 }).select('_id language')

        if (!user) return next({ 'status': false, 'message': 'User Not Found' })

        const fcm = await auth_model.find({ user_id }).select('fcm').distinct('fcm')

        const category = await sub_category_model.findById(category_id).select('name_ar name_en parent')

        if (!category) return next('Category Not Found')

        await subscription_model.updateOne({
            user_id,
            sub_category_id: category_id,
            is_premium: is_premium,
        }, {
            user_id,
            sub_category_id: category_id,
            is_premium: is_premium,
            $inc: { days }
        }, { upsert: true, new: true, setDefaultsOnInsert: true })

        if (is_premium == true) {

            if (category_id == appRadioCategoryId) {

                const ad = await app_radio_model.find({ user_id }).sort({ createdAt: -1, _id: 1 }).limit(1)

                if (ad && ad.length == 1) {
                    app_radio_model.updateOne({ _id: ad[0].id }, { is_active: true, $inc: { days: data.days } }).exec()
                }
            }
            else if (category.parent == foodCategoryId) {

                restaurant_model.updateOne({ user_id, is_premium: false }, { is_premium: true }).exec()

            } else if (category.parent == healthCategoryId) {

                doctor_model.updateOne({ user_id, is_premium: false }, { is_premium: true }).exec()

            } else if (category.id != profileViewCategoryId) {
                dynamic_ad_model.updateMany({ user_id, sub_category_id: category_id, is_premium: false }, { is_premium: true }).exec()
            }
        }

        const subCategoryName = user.language == 'ar' ? category.name_ar : category.name_en

        const titleAr = 'تم الاشتراك بنجاح'
        const titleEn = 'Subscribed Successfully'

        const bodyAr = `تم الاشتراك بنجاح في ${subCategoryName} لمدة ${days} ايام`
        const bodyEn = `Successfully subscribed in ${subCategoryName} for ${days} days`

        const notification = new notification_model({
            receiver_id: user_id,
            tab: 3,
            text_ar: bodyAr,
            text_en: bodyEn,
            type: 1001
        })

        await notification.save()

        if (user && fcm) {
            sendNotifications(
                fcm,
                user.language == 'ar' ? titleAr : titleEn,
                user.language == 'ar' ? bodyAr : bodyEn,
                1001,
            )
        }

        rider_model.updateOne({ user_id, category_id }, { indebtedness: 0, free_ride: false }).exec()


        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/gifts', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const result = await gift_model.find({})

        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})

router.post('/gifts', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const object = new gift_model(req.body)

        const result = await object.save()

        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})

router.put('/gifts', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { id } = req.body

        if (!id) return next('Bad Request')

        const result = await gift_model.findByIdAndUpdate({ _id: id }, req.body, { returnOriginal: false })


        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/gifts/:id', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        await gift_model.deleteOne({ _id: req.params.id })

        res.json({
            'status': true,
        })
    } catch (e) {
        next(e)
    }
})

router.get('/post-activities', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const result = await post_activity_model.find({})

        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})

router.post('/post-activities', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const object = new post_activity_model(req.body)

        const result = await object.save()

        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})

router.put('/post-activities', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id } = req.body

        if (!id) return next('Bad Request')

        const result = await post_activity_model.findByIdAndUpdate({ _id: id }, req.body, { returnOriginal: false })


        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/post-activities/:id', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        await post_activity_model.deleteOne({ _id: req.params.id })

        res.json({
            'status': true,
        })
    } catch (e) {
        next(e)
    }
})

router.get('/post-feelings', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const result = await post_feeling_model.find({})

        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})

router.post('/post-feelings', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const object = new post_feeling_model(req.body)

        const result = await object.save()

        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})

router.put('/post-feelings', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id } = req.body

        if (!id) return next('Bad Request')

        const result = await post_feeling_model.findByIdAndUpdate({ _id: id }, req.body, { returnOriginal: false })


        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/post-feelings/:id', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        await post_feeling_model.deleteOne({ _id: req.params.id })

        res.json({
            'status': true,
        })
    } catch (e) {
        next(e)
    }
})

router.get('/reel-songs', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { page } = req.query

        const result = await song_model.find({})
            .sort({ createdAt: -1, _id: 1 })
            .skip((((page ?? 1) - 1) * 20))
            .limit(20)

        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})

router.post('/reel-songs', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {
        const object = new song_model(req.body)

        const result = await object.save()

        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})

router.put('/reel-songs', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id } = req.body

        if (!id) return next('Bad Request')

        delete req.body.thumb_url
        delete req.body.play_url

        const result = await song_model.findByIdAndUpdate({ _id: id }, req.body, { returnOriginal: false })


        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/reel-songs/:id', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        await song_model.deleteOne({ _id: req.params.id })

        res.json({
            'status': true,
        })
    } catch (e) {
        next(e)
    }
})

router.get('/app-radio', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { page, category } = req.query

        const result = await app_radio_model.find({ category })
            .sort({ createdAt: -1, _id: 1 })
            .skip((((page ?? 1) - 1) * 20))
            .limit(20)

        const userIds = result.filter(e => e.user_id).map(e => e.user_id)

        if (userIds.length == 0) return res.json({ 'status': true, 'data': result })

        const users = await user_model.find({ _id: { $in: userIds } }).select(baseUserKeys)

        for (const item of result) {
            for (const user of users) {
                if (item.user_id == user.id) {
                    item._doc.user = user
                    break
                }
            }
        }

        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})

router.post('/app-radio', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { user_id } = req.body

        if (user_id) {

            const user = await user_model.findById(user_id).select('language')

            if (!user) return next('This User Not Exist')

            const titleAr = 'قبول الاعلان'
            const titleEn = 'Approve The Ad'

            const bodyAr = `تم قبول اعلانك الرجاء الاشتراك ليتم ظهوره لجميع المستخدمين`
            const bodyEn = `Your ad has been accepted, please subscribe to appear it for all users`

            const notifcationObject = new notification_model({
                text_ar: bodyAr,
                text_en: bodyEn,
                receiver_id: user_id,
                tab: 3,
                type: 10010,
                direction: appRadioCategoryId,
            })

            await notifcationObject.save()

            auth_model.find({ user_id }).distinct('fcm').then(fcm => {
                if (fcm.length > 0) {
                    sendNotifications(
                        fcm,
                        user.language == 'ar' ? titleAr : titleEn,
                        user.language == 'ar' ? bodyAr : bodyEn,
                        10010,
                        appRadioCategoryId,
                    )
                }
            })
        }

        const object = new app_radio_model(req.body)

        const result = await object.save()

        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})

router.put('/app-radio', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        const { id } = req.body

        if (!id) return next('Bad Request')

        const result = await app_radio_model.findByIdAndUpdate({ _id: id }, req.body, { returnOriginal: false })

        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/app-radio/:id', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {

    try {

        await app_radio_model.deleteOne({ _id: req.params.id })

        res.json({
            'status': true,
        })
    } catch (e) {
        next(e)
    }
})

router.get('/dynamic-ads/:mainCategory', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { page } = req.query

        const result = await dynamic_ad_model.find({
            is_approved: true,
            main_category_id: req.params.mainCategory
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


        const data = await Promise.all([
            user_model.find({ _id: { $in: usersIds } }).select('_id first_name last_name profile_picture phone')
            , subscription_model.find({ sub_category_id: { $in: subCategoryIds }, user_id: { $in: usersIds } }).distinct('user_id')
            , dynamic_prop_model.find({ sub_category_id: { $in: subCategoryIds } }),
            sub_category_model.find({ _id: { $in: subCategoryIds } }),
        ])

        const users = data[0];

        const subscriptions = data[1];

        const props = data[2];

        const subCategories = data[3];


        result.forEach(ad => {

            ad._doc.is_favorite = false
            ad._doc.is_subscription = subscriptions.includes(ad.user_id)

            for (const subCategory of subCategories) {
                if (subCategory.id == ad.sub_category_id) {
                    ad._doc.sub_category_name = subCategory.name_en;
                    break;
                }
            }
            ad.props.forEach(adProp => {
                for (const prop of props) {
                    if (prop.id == adProp.id) {
                        adProp._id = adProp.id
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

router.delete('/dynamic-ads/:id', verifyTokenAndSuperAdmin, async (req, res, next) => {


    try {

        await dynamic_ad_model.deleteOne({ _id: req.params.id })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/riders', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const riders = await rider_model.find({ is_approved: true }).sort({ 'trips': -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20)

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

router.post('/search-riders', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { data } = req.body

        const { language } = req.headers

        var result = [];

        const searchResult = await user_model.find(
            {
                is_rider: true,
                $or: [
                    { first_name: { $regex: '.*' + data + '.*', $options: 'i' } },
                    { last_name: { $regex: '.*' + data + '.*', $options: 'i' } },
                    { email: { $regex: '.*' + data + '.*', $options: 'i' } },
                    { phone: { $regex: '.*' + data + '.*', $options: 'i' } },
                ]
            }).limit(100).select('_id')


        if (searchResult.length > 0) {

            const riders = await rider_model.find({ user_id: { $in: searchResult.map(e => e.id.toString()) } })

            if (riders.length > 0) {

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
                result = riders
            }

        }

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.delete('/riders/:id', verifyTokenAndSuperAdmin, async (req, res, next) => {


    try {

        const rider = await rider_model.findOneAndDelete({ _id: req.params.id }).select('user_id')

        if (rider) {
            ride_model.deleteMany({ rider_id: rider.user_id }).exec()
        }
        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/loadings', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const riders = await loading_model.find({ is_approved: true }).skip((((page ?? 1) - 1) * 20)).limit(20)

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


router.post('/search-loadings', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { data } = req.body

        const { language } = req.headers

        var result = [];

        const searchResult = await user_model.find(
            {
                is_loading: true,
                $or: [
                    { first_name: { $regex: '.*' + data + '.*', $options: 'i' } },
                    { last_name: { $regex: '.*' + data + '.*', $options: 'i' } },
                    { email: { $regex: '.*' + data + '.*', $options: 'i' } },
                    { phone: { $regex: '.*' + data + '.*', $options: 'i' } },
                ]
            }).limit(100).select('_id')


        if (searchResult.length > 0) {

            const riders = await loading_model.find({ user_id: { $in: searchResult.map(e => e.id.toString()) } })

            if (riders.length > 0) {

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
                result = riders
            }

        }

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.delete('/loadings/:id', verifyTokenAndSuperAdmin, async (req, res, next) => {


    try {

        const loading = await loading_model.findOneAndDelete({ _id: req.params.id }).select('user_id')

        if (loading) {
            loading_trip_model.deleteMany({ rider_id: loading.user_id }).exec()
        }

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/restaurants', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const riders = await restaurant_model.find({ is_approved: true }).skip((((page ?? 1) - 1) * 20)).limit(20)

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

router.post('/search-restaurants', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { data } = req.body

        const { language } = req.headers

        var result = [];

        const searchResult = await user_model.find(
            {
                is_restaurant: true,
                $or: [
                    { first_name: { $regex: '.*' + data + '.*', $options: 'i' } },
                    { last_name: { $regex: '.*' + data + '.*', $options: 'i' } },
                    { email: { $regex: '.*' + data + '.*', $options: 'i' } },
                    { phone: { $regex: '.*' + data + '.*', $options: 'i' } },
                ]
            }).limit(100).select('_id')


        if (searchResult.length > 0) {

            const riders = await restaurant_model.find({ user_id: { $in: searchResult.map(e => e.id.toString()) } })

            if (riders.length > 0) {

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
                result = riders
            }

        }

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.delete('/restaurants/:id', verifyTokenAndSuperAdmin, async (req, res, next) => {


    try {


        const restaurant = await restaurant_model.findOneAndDelete({ _id: req.params.id }).select('user_id')

        if (restaurant) {

            food_model.deleteMany({ restaurant_id: restaurant.user_id }).exec()
            food_order_model.deleteMany({ restaurant_id: restaurant.user_id }).exec()
        }
        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/health', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const riders = await doctor_model.find({ is_approved: true }).skip((((page ?? 1) - 1) * 20)).limit(20)

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

router.post('/search-health', verifyTokenAndSuperAdmin, async (req, res, next) => {

    try {

        const { data } = req.body

        const { language } = req.headers

        var result = [];

        const searchResult = await user_model.find(
            {
                is_doctor: true,
                $or: [
                    { first_name: { $regex: '.*' + data + '.*', $options: 'i' } },
                    { last_name: { $regex: '.*' + data + '.*', $options: 'i' } },
                    { email: { $regex: '.*' + data + '.*', $options: 'i' } },
                    { phone: { $regex: '.*' + data + '.*', $options: 'i' } },
                ]
            }).limit(100).select('_id')


        if (searchResult.length > 0) {

            const riders = await doctor_model.find({ user_id: { $in: searchResult.map(e => e.id.toString()) } })

            if (riders.length > 0) {

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
                result = riders
            }

        }

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.delete('/health/:id', verifyTokenAndSuperAdmin, async (req, res, next) => {


    try {

        const doctor = await doctor_model.findOneAndDelete({ _id: req.params.id })

        if (doctor) {
            patient_book_model.deleteMany({ user_id: doctor.user_id }).exec()
        }
        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})



router.get('/get-monthly-contest-pending-transitions', verifyTokenAndSuperAdmin, async (req, res, next) => {
    try {
        const result = await monthly_contest_model.find({ is_pay_valid: false }).exec();
        const userIds = result.map(item => item.user_id);
        if (userIds.length > 0) {
            const users = await user_model.find({ user_id: { $in: userIds } }).select(baseUserKeys).exec();
            result.forEach(item => {
                item.user = users.find(user => String(user._id) === item.user_id);
            })
        }
        res.json({
            status: true,
            data: result,
        })
    } catch (e) {
        next(e)
    }
})
router.get('/get-monthly-contest-users', async (req, res, next) => {

    try {
        const { date, is_winner } = req.query;
        const result = await monthly_contest_model.find(is_winner == 0 || is_winner == 1 ? {
            date: date,
            is_pay_valid: true,
            is_winner: is_winner == '1',
        } : {
            date: date,
            is_pay_valid: true,
        }).exec();

        const userIds = result.map(item => item.user_id);
        if (userIds.length > 0) {
            const users = await user_model.find({ user_id: { $in: userIds } }).select(baseUserKeys).exec();
            result.forEach(item => {
                item.user = users.find(user => String(user._id) === item.user_id);
                item.times = result.map(one => one.user_id === item.user_id).length;
            })
        }
        res.json({
            status: true,
            data: result,
        })
    } catch (e) {
        next(e);
    }
})
router.put('/accept-monthly-contest-transition/:id', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        await monthly_contest_model.updateOne({ _id: id }, { is_pay_valid: true }).exec();

        res.json({
            status: true,
        })

    } catch (e) {
        next(e);
    }
})

router.put('/decline-monthly-contest-transition/:id', verifyTokenAndSuperAdminOrAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        await monthly_contest_model.deleteOne({ _id: id });
        res.json({
            status: true,
        })

    } catch (e) {
        next(e);
    }
})

router.get('/complaints', verifyTokenAndSuperAdmin, async (req, res, next) => {
    try {

        const result = await complaintـmodel.find({}).exec();
        if (result.length > 0) {
            const userIds = result.filter(e => e.user_id != null).map(item => item.user_id);
            if (userIds.length > 0) {
                const users = await user_model.find({ _id: { $in: userIds } }).select(baseUserKeys).exec();
                result.forEach(item => {
                    item.user = users.find(user => String(user._id) === item.user_id);
                })
            }
        }
        res.json({
            status: true,
            data: result,
        })
    } catch (e) {
        next(e)
    }
})
router.delete('/complaints/:id', verifyTokenAndSuperAdmin, async (req, res, next) => {
    try {
        await complaintـmodel.deleteOne({ _id: req.params.id });
        res.json({
            status: true,
        })
    } catch (e) {
        next(e);
    }
})
export default router