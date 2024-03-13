import express from 'express'
import { baseUserKeys, verifyToken } from '../../helper.js'
import user_model from '../../models/user_model.js'
import mongoose from 'mongoose'
import { sendNotifications } from '../../controllers/notification_controller.js'
import notification_model from '../../models/notification_model.js'
import auth_model from '../../models/auth_model.js'
import post_model from '../../models/post_model.js'
import profile_view_model from '../../models/profile_view_model.js'
import reel_model from '../../models/reel_model.js'
import post_comment_model from '../../models/post_comment_model.js'

const router = express.Router()

router.get('/get-peer/:id', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const user = await user_model.findOne(req.user.isAdmin == true || req.user.isSuperAdmin == true ? { _id: req.params.id } : { _id: req.params.id, block: { $nin: [req.user.id] } }).select('tinder_picture first_name last_name profile_picture cover_picture phone social_status is_male birth_date job city country referral_id privacy_country privacy_phone privacy_social_status privacy_job privacy_city privacy_is_male privacy_receive_messages privacy_follower_list privacy_friend_list privacy_friend_request privacy_follow_request privacy_call privacy_birth_date bio')

        var isPeerBlocked = false

        if (req.user.isAdmin == false && req.user.isSuperAdmin == false){
            isPeerBlocked = (await user_model.findOne({ _id: req.user.id, block: { $nin: [req.params.id] } })) == null
        }

        if (req.user.isAdmin == false && req.user.isSuperAdmin == false && (!user || isPeerBlocked)) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })


        const result = await Promise.all([
            user_model.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(req.params.id) } }, {
                    $project: {
                        total_friends: { $size: '$friends' },
                        total_followers: { $size: '$followers' },
                        total_following: { $size: '$following' },
                        is_friend: { $in: [req.user.id, '$friends'] },
                        is_follower: { $in: [req.user.id, '$followers'] },
                        is_friend_request_sent: { $in: [req.user.id, '$friend_requests'] },
                        is_blocked: { $in: [req.user.id, '$block'] },
                    }
                }]),
            post_model.findOne({ user_id: req.params.id }).count(),
            reel_model.findOne({ user_id: req.params.id }).count(),
        ])

        const info = result[0]
        const totalPosts = result[1] + result[2]

        const isFriend = info[0].is_friend
        const isFollower = info[0].is_follower
        const isFriendRequestSent = info[0].is_friend_request_sent

        if (info[0].is_blocked) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        var data = {
            'user': {
                '_id': user.id,
                'first_name': user.first_name.trim(),
                'last_name': user.last_name.trim(),
                'profile_picture': user.profile_picture,
                'cover_picture': user.cover_picture,
                'tinder_picture' : user.tinder_picture,
            },
            'total_friends': info[0].total_friends,
            'total_followers': info[0].total_followers,
            'total_following': info[0].total_following,
            'total_posts': totalPosts,
            'is_friend': isFriend,
            'is_follower': isFollower,
            'bio': user.bio,
            'friend_request_sent': isFriendRequestSent,
            'friend_request_enable': user.privacy_friend_request == 2 || (isFriend && user.privacy_friend_request == 3) || (isFollower && user.privacy_friend_request == 4) || ((isFollower || isFriend) && user.privacy_friend_request == 5),
            'is_message_enable': user.privacy_receive_messages == 2 || (isFriend && user.privacy_receive_messages == 3) || (isFollower && user.privacy_receive_messages == 4) || ((isFollower || isFriend) && user.privacy_receive_messages == 5),
            'is_call_enable': user.privacy_call == 2 || (isFriend && user.privacy_call == 3) || (isFollower && user.privacy_call == 4) || ((isFollower || isFriend) && user.privacy_call == 5),
            'is_follow_list_enable': user.privacy_follower_list == 2 || (isFriend && user.privacy_follower_list == 3) || (isFollower && user.privacy_follower_list == 4) || ((isFollower || isFriend) && user.privacy_follower_list == 5),
            'is_friend_list_enable': user.privacy_friend_list == 2 || (isFriend && user.privacy_friend_list == 3) || (isFollower && user.privacy_friend_list == 4) || ((isFollower || isFriend) && user.privacy_friend_list == 5),
        }

        if (user.privacy_phone == 2 || (isFriend && user.privacy_phone == 3) || (isFollower && user.privacy_phone == 4) || ((isFollower || isFriend) && user.privacy_phone == 5))
            data.phone = user.phone

        if (user.privacy_is_male == 2 || (isFriend && user.privacy_is_male == 3) || (isFollower && user.privacy_is_male == 4) || ((isFollower || isFriend) && user.privacy_is_male == 5))
            data.is_male = user.is_male

        if (user.privacy_social_status == 2 || (isFriend && user.privacy_social_status == 3) || (isFollower && user.privacy_social_status == 4) || ((isFollower || isFriend) && user.privacy_social_status == 5))
            data.social_status = user.social_status

        if (user.privacy_birth_date == 2 || (isFriend && user.privacy_birth_date == 3) || (isFollower && user.privacy_birth_date == 4) || ((isFollower || isFriend) && user.privacy_birth_date == 5))
            data.birth_date = user.birth_date

        if (user.privacy_job == 2 || (isFriend && user.privacy_job == 3) || (isFollower && user.privacy_job == 4) || ((isFollower || isFriend) && user.privacy_job == 5))
            data.job = user.job

        if (user.privacy_city == 2 || (isFriend && user.privacy_city == 3) || (isFollower && user.privacy_city == 4) || ((isFollower || isFriend) && user.privacy_city == 5))
            data.city = user.city

        if (user.privacy_country == 2 || (isFriend && user.privacy_country == 3) || (isFollower && user.privacy_country == 4) || ((isFollower || isFriend) && user.privacy_country == 5))
            data.country = user.country


        if (user.referral_id) {
            const referralUser = await user_model.findById(user.referral_id).select('first_name last_name')
            if (referralUser) {
                data.referral_name = `${referralUser.first_name.trim()} ${referralUser.last_name.trim()}`
                data.referral_id = referralUser.id
            }
        }

        if (req.user.id != req.params.id) {
            profile_view_model.updateOne({
                user_id: req.user.id,
                owner_id: req.params.id,
            }, {
                user_id: req.user.id,
                owner_id: req.params.id,
                $inc: { times: 1 }
            }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec()
        }

        res.json({
            'status': true,
            'data': data
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/send-friend-request', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { peer_id } = req.body

        if (!peer_id) return next('Bad Request')

        const exist = await user_model.findOne({ _id: peer_id, friend_requests: { $all: [req.user.id] } }).select('_id')

        if (exist) return next({ 'status': 400, 'message': language == 'ar' ? 'لقد أرسلت طلب صداقة بالفعل' : 'You have already sent a friend request' })

        const peer = await user_model.findOne({ _id: peer_id }).select('_id language')

        const user = await user_model.findOne({ _id: req.user.id }).select('first_name last_name profile_picture')

        if (!user) return next({ 'status': 400, 'message': language == 'ar' ? 'الحساب ليس موجود' : 'The Account is not exist' })

        const isAlreadySentRequest = await user_model.findOne({ _id: req.user.id, friend_requests: { $all: [peer_id] } }).select('_id')

        if (isAlreadySentRequest) {

            await user_model.updateOne({ _id: req.user.id }, { $addToSet: { friends: peer_id, followers: peer_id }, $pull: { friend_requests: peer_id } })
            await user_model.updateOne({ _id: peer_id }, { $addToSet: { friends: req.user.id, followers: req.user.id }, $pull: { friend_requests: req.user.id } })

            return res.json({
                'status': true,
                'data': language == 'ar' ? 'لقد اصبحتم اصدقاء الان' : 'You are now friends'
            })

        } else {
            await user_model.updateOne(
                { _id: peer_id },
                { $addToSet: { friend_requests: req.user.id, followers: req.user.id } },
            ).exec()

            if ((await notification_model.findOne({ receiver_id: peer_id, user_id: req.user.id, type: 2 })) == null) {

                const titleAr = 'طلب صداقة جديد'
                const titleEn = 'New Friend Request'

                const bodyAr = `قام ${user.first_name.trim()} ${user.last_name.trim()} بارسال طلب صداقة`
                const bodyEn = `${user.first_name.trim()} ${user.last_name.trim()} has sent a friend request`

                const notifcationObject = new notification_model({
                    text_ar: bodyAr,
                    text_en: bodyEn,
                    receiver_id: peer_id,
                    tab: 1,
                    user_id: req.user.id,
                    type: 2,
                    direction: user.id,
                })

                notifcationObject.save()

                auth_model.find({ user_id: peer_id }).distinct('fcm').then(fcm => {
                    if (fcm.length > 0) {
                        sendNotifications(
                            fcm,
                            peer.language == 'ar' ? titleAr : titleEn,
                            peer.language == 'ar' ? bodyAr : bodyEn,
                            2,
                            req.user.id,
                        )
                    }
                })
            }
        }
        res.json({
            'status': true,
            'data': language == 'ar' ? 'تم ارسال طلب الصداقة' : 'Friend Request Sent'
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/accept-friend-request', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { peer_id } = req.body

        if (!peer_id) return next('Bad Request')

        const exist = await user_model.findOne({ _id: req.user.id, friend_requests: { $all: [peer_id] } }).select('_id first_name last_name')

        if (!exist) return next({ 'status': 400, 'message': language == 'ar' ? 'هذا المستخدم لم يقم بارسال طلب صداقة لك' : 'This user has not sent you a friend request' })

        const peer = await user_model.findById(peer_id).select('language')

        if (!peer) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        await user_model.updateOne(
            { _id: req.user.id },
            { $pull: { friend_requests: peer_id }, $addToSet: { friends: peer_id, followers: peer_id } },
        ).exec()

        await user_model.updateOne(
            { _id: peer_id },
            { $pull: { friend_requests: req.user.id }, $addToSet: { friends: req.user.id, followers: req.user.id } },
        ).exec()

        const titleAr = 'قبول طلب الصداقة'
        const titleEn = 'Accept the friend request'

        const bodyAr = `قام ${exist.first_name.trim()} ${exist.last_name.trim()} بقبول طلب الصداقة`
        const bodyEn = `${exist.first_name.trim()} ${exist.last_name.trim()} has accepted the friend request`

        const notifcationObject = new notification_model({
            text_ar: bodyAr,
            text_en: bodyEn,
            receiver_id: peer_id,
            tab: 1,
            user_id: req.user.id,
            type: 5,
            direction: req.user.id,
        })

        notifcationObject.save()

        auth_model.find({ user_id: peer_id }).distinct('fcm').then(fcm => {
            if (fcm) {
                sendNotifications(
                    fcm,
                    peer.language == 'ar' ? titleAr : titleEn,
                    peer.language == 'ar' ? bodyAr : bodyEn,
                    5,
                    req.user.id,
                )
            }
        })

        res.json({
            'status': true,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.delete('/cancel-friend-request', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { peer_id } = req.body

        if (!peer_id) return next('Bad Request')

        const exist = await user_model.findOne({ _id: peer_id, friend_requests: { $all: [req.user.id] } }).select('_id')

        if (!exist) return next({ 'status': 400, 'message': language == 'ar' ? 'لم تقم بارسال طلب صداقة لهذا المستخدم' : 'You have not sent a friend request to this user' })

        await user_model.updateOne(
            { _id: peer_id },
            { $pull: { friend_requests: req.user.id } },
        ).exec()

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/remove-friend-request', verifyToken, async (req, res, next) => {

    try {

        const { peer_id } = req.body

        if (!peer_id) return next('Bad Request')

        await user_model.updateOne(
            { _id: req.user.id },
            { $pull: { friend_requests: peer_id } },
        ).exec()

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/un-friend', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { peer_id } = req.body

        if (!peer_id) return next('Bad Request')

        const user = await user_model.findById(req.user.id).select('first_name last_name profile_picture cover_picture')

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        const exist = await user_model.findOne({ _id: peer_id, friends: { $all: [req.user.id] } }).select('_id')

        if (!exist) return next({ 'status': 400, 'message': language == 'ar' ? 'انتم لستم اصدقاء' : 'You are not friends' })

        await user_model.updateOne(
            { _id: peer_id },
            { $pull: { friends: req.user.id } },
        ).exec()

        await user_model.updateOne(
            { _id: req.user.id },
            { $pull: { friends: peer_id } },
        ).exec()

        const titleAr = `الغاء صداقة`
        const titleEn = 'UnFriend'

        const bodyAr = `قام ${user.first_name.trim()} ${user.last_name.trim()} بالغاء الصداقة`
        const bodyEn = `${user.first_name.trim()} ${user.last_name.trim()} has unfriended`

        const notifcationObject = new notification_model({
            text_ar: bodyAr,
            text_en: bodyEn,
            receiver_id: peer_id,
            tab: 1,
            user_id: req.user.id,
            type: 4,
            direction: user.id,
        })

        notifcationObject.save()



        Promise.all([
            user_model.findById(peer_id).select('language'),
            auth_model.find({ user_id: peer_id }).distinct('fcm')
        ]).then(r => {

            const user = r[0]
            const fcm = r[1]

            if (fcm) {
                sendNotifications(
                    fcm,
                    user.language == 'ar' ? titleAr : titleEn,
                    user.language == 'ar' ? bodyAr : bodyEn,
                    4,
                    req.user.id,
                )
            }
        })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/follow', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { peer_id } = req.body

        if (!peer_id) return next('Bad Request')

        const user = await user_model.findOne({ _id: peer_id, block: { $nin: [req.user.id] } }).select('_id')

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        const exist = await user_model.findOne({ _id: peer_id, followers: { $all: [req.user.id] } }).select('_id')

        if (exist) return next({ 'status': 400, 'message': language == 'ar' ? 'أنت تتابعه بالفعل' : 'You\'re already Following him' })

        await Promise.all([
            user_model.updateOne(
                { _id: peer_id },
                { $addToSet: { followers: req.user.id } },
            ),
            user_model.updateOne(
                { _id: req.user.id },
                { $addToSet: { following: peer_id } },
            )
        ])

        res.json({
            'status': true,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.delete('/un-follow', verifyToken, async (req, res, next) => {

    try {

        const { peer_id } = req.body

        if (!peer_id) return next('Bad Request')

        await Promise.all([
            user_model.updateOne(
                { _id: peer_id },
                { $pull: { followers: req.user.id } },
            ),
            user_model.updateOne(
                { _id: req.user.id },
                { $pull: { following: peer_id } },
            )
        ])

        res.json({
            'status': true,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/block', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { peer_id } = req.body

        if (!peer_id) return next('Bad Request')

        const user = await user_model.findOne({ _id: peer_id, block: { $nin: [req.user.id] } }).select('_id friends')

        if (!user || peer_id == req.user.id) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        await user_model.updateOne(
            { _id: req.user.id },
            { $addToSet: { block: peer_id }, $pull: { friends: peer_id, followers: peer_id, following: peer_id, friend_requests: peer_id } },
        ).exec()

        user_model.updateOne(
            { _id: peer_id },
            { $pull: { friends: req.user.id, followers: req.user.id, following: req.user.id, friend_requests: req.user.id } },
        ).exec()

        post_model.updateOne({ user_id: peer_id }, { $pull: { tags: req.user.id } }).exec()
        post_model.updateOne({ user_id: req.user.id }, { $pull: { tags: peer_id } }).exec()

        post_comment_model.deleteMany({ post_owner_id: peer_id, user_id: req.user.id }).exec()
        post_comment_model.deleteMany({ post_owner_id: req.user.id, user_id: peer_id }).exec()

        if (user.friends.includes(req.user.id)) {

            const userData = await user_model.findOne({ _id: req.user.id }).select('first_name last_name')

            if (userData) {

                const titleAr = `تم حظرك`
                const titleEn = 'You are Blocked'

                const bodyAr = `قام ${userData.first_name.trim()} ${userData.last_name.trim()} بحظرك`
                const bodyEn = `${userData.first_name.trim()} ${userData.last_name.trim()} has Blocked you`

                const notifcationObject = new notification_model({
                    text_ar: bodyAr,
                    text_en: bodyEn,
                    receiver_id: peer_id,
                    tab: 1,
                    type: 10,
                })

                notifcationObject.save()


                Promise.all([
                    user_model.findById(peer_id).select('language'),
                    auth_model.find({ user_id: peer_id }).distinct('fcm')
                ]).then(r => {

                    const user = r[0]
                    const fcm = r[1]

                    if (fcm) {
                        sendNotifications(
                            fcm,
                            user.language == 'ar' ? titleAr : titleEn,
                            user.language == 'ar' ? bodyAr : bodyEn,
                            4,
                            req.user.id,
                        )
                    }
                })
            }
        } else {
            console.log('here')
        }

        res.json({
            'status': true,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.delete('/un-block', verifyToken, async (req, res, next) => {

    try {

        const { peer_id } = req.body

        if (!peer_id) return next('Bad Request')

        await user_model.updateOne(
            { _id: req.user.id },
            { $pull: { block: peer_id } },
        ).exec()

        res.json({
            'status': true,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

export default router