import express from 'express'
import user_model from '../models/user_model.js'
import { verifyToken, getUserData, fullUserKeys, tryVerify } from '../helper.js'
import wallet_model from '../models/wallet_model.js'
import rider_model from '../models/rider_model.js'
import loading_model from '../models/loading_model.js'
import doctor_model from '../models/doctor_model.js'
import restaurant_model from '../models/restaurant_model.js'
import dynamic_ad_model from '../models/dynamic_ad_model.js'
import mongoose from 'mongoose'
import post_model from '../models/post_model.js'
import reel_model from '../models/reel_model.js'
import auth_model from '../models/auth_model.js'
import call_log_model from '../models/call_log_model.js.js'
import chat_group_model from '../models/chat_group_model.js'
import food_order_model from '../models/food_order_model.js'

import come_with_me_ride_model from '../models/come_with_me_ride_model.js'
import comment_replay_model from '../models/comment_replay_model.js'
import contact_model from '../models/contact_model.js'
import favorite_model from '../models/favorite_model.js'
import food_model from '../models/food_model.js'
import hidden_opinion_model from '../models/hidden_opinion_model.js'
import loading_trip_model from '../models/loading_trip_model.js'
import message_model from '../models/message_model.js'
import notification_model from '../models/notification_model.js'
import patient_book_model from '../models/patient_book_model.js'
import pick_me_ride_model from '../models/pick_me_ride_model.js'
import post_comment_model from '../models/post_comment_model.js'
import profile_view_model from '../models/profile_view_model.js'
import rating_model from '../models/rating_model.js'
import report_model from '../models/report_model.js'
import ride_model from '../models/ride_model.js'
import song_model from '../models/song_model.js'
import subscription_model from '../models/subscription_model.js'
import complaintـmodel from '../models/complaintـmodel.js'
import { sendNotificationToAdmin } from '../controllers/notification_controller.js'

const router = express.Router()

router.get('/', verifyToken, async (req, res, next) => {

    try {

        const result = await user_model.findOne({ _id: req.user.id, is_locked: false }).select(fullUserKeys)

        if (!result) return next({ 'status': 401, 'message': 'Unauthorized' })

        const info = await Promise.all([
            user_model.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(req.user.id) } }, {
                    $project: {
                        total_friends: { $size: '$friends' },
                        total_followers: { $size: '$followers' },
                        total_following: { $size: '$following' },
                    }
                }]),
            post_model.findOne({ user_id: req.user.id }).count(),
            reel_model.findOne({ user_id: req.user.id }).count(),
        ])


        const data = getUserData(result)

        data.total_friends = info[0][0].total_friends
        data.total_followers = info[0][0].total_followers
        data.total_following = info[0][0].total_following
        data.total_posts = info[1] + info[2]

        return res.json({
            'status': true,
            'data': data,
        })


    } catch (e) {
        next(e)
    }
}
)

router.put('/', verifyToken, async (req, res, next) => {
    try {

        if (!req.body.first_name || !req.body.last_name) return next('Bad Request')

        const result = await user_model.findOneAndUpdate({ _id: req.user.id }, {
            'first_name': req.body.first_name,
            'last_name': req.body.last_name,
            'phone': req.body.phone,
            'is_male': req.body.is_male,
            'birth_date': req.body.birth_date,
            'country': req.body.country,
            'language': req.body.language,
            'social_status': req.body.social_status,
            'city': req.body.city,
            'job': req.body.job,
            'privacy_country': req.body.privacy_country,
            'privacy_email': req.body.privacy_email,
            'privacy_phone': req.body.privacy_phone,
            'privacy_birth_date': req.body.privacy_birth_date,
            'privacy_social_status': req.body.privacy_social_status,
            'privacy_job': req.body.privacy_job,
            'privacy_city': req.body.privacy_city,
            'privacy_is_male': req.body.privacy_is_male,
            'privacy_language': req.body.privacy_language,
            'privacy_receive_messages': req.body.privacy_receive_messages,
            'privacy_last_seen': req.body.privacy_last_seen,
            'privacy_friend_list': req.body.privacy_friend_list,
            'privacy_follower_list': req.body.privacy_follower_list,
            'privacy_activity': req.body.privacy_activity,
            'privacy_random_appearance': req.body.privacy_random_appearance,
            'privacy_friend_request': req.body.privacy_friend_request,
            'privacy_follow_request': req.body.privacy_follow_request,
            'privacy_call': req.body.privacy_call,
            'bio': req.body.bio,

        }, { returnOriginal: false }).select(fullUserKeys)

        if (!result) return next({ 'status': 404, 'message': language == 'ar' ? 'المستخدم غير موجود' : 'User not found' })

        if (result.is_male == false && result.profile_picture == 'user-profile%20MAN.png') {
            result._doc.profile_picture = 'user-profile%20GIRL.png'
            user_model.findOneAndUpdate({ _id: req.user.id }, { profile_picture: 'user-profile%20GIRL.png' }).exec()
        }

        const info = await Promise.all([
            user_model.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(req.user.id) } }, {
                    $project: {
                        total_friends: { $size: '$friends' },
                        total_followers: { $size: '$followers' },
                        total_following: { $size: '$following' },
                    }
                }]),
            post_model.findOne({ user_id: req.user.id }).count(),
            reel_model.findOne({ user_id: req.user.id }).count(),
        ])

        const data = getUserData(result)

        data.total_friends = info[0][0].total_friends
        data.total_followers = info[0][0].total_followers
        data.total_following = info[0][0].total_following
        data.total_posts = info[1] + info[2]

        return res.json({
            'status': true,
            'data': data,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }

})

router.post('/change-profile-pic', verifyToken, async (req, res, next) => {

    try {

        const { path } = req.body

        if (!path) return next('Bad Request')

        await user_model.updateOne({ _id: req.user.id }, { profile_picture: path })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/change-cover-pic', verifyToken, async (req, res, next) => {

    try {

        const { path } = req.body

        if (!path) return next('Bad Request')

        await user_model.updateOne({ _id: req.user.id }, { cover_picture: path })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.put('/update-currency', verifyToken, async (req, res, next) => {

    try {

        const { currency, country_code, } = req.body

        if (!currency) return next('Bad Request')

        await user_model.updateOne({ _id: req.user.id }, { currency, country_code })

        rider_model.updateOne({ user_id: req.user.id }, { country_code }).exec()

        loading_model.updateOne({ user_id: req.user.id }, { country_code }).exec()

        doctor_model.updateOne({ user_id: req.user.id }, { country_code }).exec()

        restaurant_model.updateOne({ user_id: req.user.id }, { country_code }).exec()

        dynamic_ad_model.updateMany({ user_id: req.user.id }, { country_code }).exec()

        return res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/wallet', verifyToken, async (req, res, next) => {

    try {

        const result = await wallet_model.findOne({ user_id: req.user.id }).select('balance five_years ten_years total_payment total_cash_back free_click_storage createdAt')

        if (!result) return next({ 'status': 404, 'message': language == 'ar' ? 'المستخدم غير موجود' : 'User not found' })

        if (result.balance > 1000 && result.free_click_storage > 0) {
            result._doc.free_click_storage = 0
            await wallet_model.updateOne({ user_id: req.user.id }, { free_click_storage: 0 })
        }

        delete result._doc.free_click_storage

        return res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/delete-account', verifyToken, async (req, res, next) => {

    try {

        auth_model.deleteMany({ user_id: req.user.id }).exec()
        call_log_model.deleteMany({ $or: [{ user_id: req.user.id }, { caller_id: req.user.id }] }).exec()

        come_with_me_ride_model.deleteOne({ user_id: req.user.id }).exec()
        doctor_model.deleteOne({ user_id: req.user.id }).exec()
        loading_model.deleteOne({ user_id: req.user.id }).exec()
        restaurant_model.deleteOne({ user_id: req.user.id }).exec()
        loading_trip_model.deleteMany({ $or: [{ user_id: req.user.id }, { rider_id: req.user.id }] }).exec()
        ride_model.deleteMany({ $or: [{ user_id: req.user.id }, { rider_id: req.user.id }] }).exec()
        patient_book_model.deleteMany({ $or: [{ user_id: req.user.id }, { doctor_id: req.user.id }] }).exec()
        pick_me_ride_model.deleteMany({ user_id: req.user.id }).exec()

        comment_replay_model.deleteMany({ user_id: req.user.id }).exec()
        contact_model.deleteMany({ $or: [{ user_id: req.user.id }, { owner_id: req.user.id }] }).exec()
        dynamic_ad_model.deleteMany({ user_id: req.user.id }).exec()
        favorite_model.deleteMany({ user_id: req.user.id }).exec()
        food_model.deleteMany({ restaurant_id: req.user.id }).exec()
        hidden_opinion_model.deleteMany({ $or: [{ user_id: req.user.id }, { receiver_id: req.user.id }] }).exec()
        message_model.deleteMany({ type: 1, $or: [{ user_id: req.user.id }, { receiver_id: req.user.id }] }).exec() // private messages
        notification_model.deleteMany({ $or: [{ user_id: req.user.id }, { receiver_id: req.user.id }] }).exec()

        post_comment_model.deleteMany({ user_id: req.user.id }).exec()
        post_model.deleteMany({ user_id: req.user.id }).exec()
        post_model.updateMany({}, { $pull: { tags: req.user.id } }).exec()
        profile_view_model.deleteMany({ $or: [{ user_id: req.user.id }, { owner_id: req.user.id }] }).exec()
        rating_model.deleteMany({ $or: [{ user_id: req.user.id }, { user_rating_id: req.user.id }] }).exec()
        reel_model.deleteMany({ user_id: req.user.id }, { user_rating_id: req.user.id }).exec()
        report_model.deleteMany({ $or: [{ user_id: req.user.id }, { reporter_id: req.user.id }] }).exec()
        song_model.deleteMany({ owner_id: req.user.id }).exec()
        subscription_model.deleteMany({ user_id: req.user.id }).exec()
        wallet_model.deleteOne({ user_id: req.user.id }).exec()
        user_model.deleteOne({ _id: req.user.id }).exec()

        user_model.updateMany({}, { $pull: { friends: req.user.id, friend_requests: req.user.id, followers: req.user.id, following: req.user.id, block: req.user.id } }).exec()

        //chat_group_model.deleteMany({ owner_id: req.user.id }).exec() // delete owner groups , remove from members , delete all message, get groups and delete his messages

        post_model.updateMany({}, { $pull: { tags: req.user.id, likes: req.user.id, love: req.user.id, wow: req.user.id, sad: req.user.id, angry: req.user.id, shares: req.user.id } }).exec()

        message_model.updateMany({}, { $pull: { likes: req.user.id, love: req.user.id, wow: req.user.id, sad: req.user.id, angry: req.user.id } }).exec()
        food_order_model.deleteMany({ restaurant_id: req.user.id }).exec()
        food_order_model.deleteMany({ user_id: req.user.id }).exec()

        chat_group_model.deleteMany({ owner_id: req.user.id }).exec()
        contact_model.deleteMany({ owner_id: req.user.id }).exec()
        chat_group_model.updateMany({}, { $pull: { members: req.user.id, admins: req.user.id } }).exec()

        res.json({
            'status': true,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/complaints', tryVerify, async (req, res, next) => {
    try {
        const { name, phone, description } = req.body
        if (!name || !phone || !description) return next('Bad Request')
        const complaint = new complaintـmodel({
            user_id: req.user.id,
            name,
            phone,
            description,
        })
        await complaint.save()
        sendNotificationToAdmin('New Complaint', `New Complaint from ${name ?? 'None'} with phone ${phone ?? 'None'}`);
        res.json({
            'status': true
        })
    } catch (e) {
        next(e)
    }
})
export default router