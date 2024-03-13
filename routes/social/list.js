import express from 'express'
import mongoose from 'mongoose'

import user_model from '../../models/user_model.js'
import { baseUserKeys, verifyToken } from '../../helper.js'
import profile_view_model from '../../models/profile_view_model.js'
import subscription_model from '../../models/subscription_model.js'
import { profileViewCategoryId } from '../../controllers/ride_controller.js'

const router = express.Router()

router.get('/total', verifyToken, async (req, res, next) => {

    try {

        const total = await user_model.aggregate([{
            $match: { _id: mongoose.Types.ObjectId(req.user.id) }
        },
        {
            $project: {
                friends: { $size: '$friends' },
                friend_requests: { $size: '$friend_requests' },
                block: { $size: '$block' },
                followers: { $size: '$followers' },
            },
        }]).limit(1)

        res.json({
            'status': true,
            'data': total[0],
        })

    } catch (e) {
        next(e)
    }
})

router.get('/my-friends', verifyToken, async (req, res, next) => {

    try {

        const { page } = req.params

        var result = []

        const userIds = await user_model.findById(req.user.id, { friends: { $slice: [(((page ?? 1) - 1) * 20), 20] } }).select('friends')

        if (userIds.friends.length > 0)
            result = await user_model.find({ _id: { $in: userIds.friends } }).select(baseUserKeys)

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/my-friend-requests', verifyToken, async (req, res, next) => {

    try {

        const { page } = req.params

        var result = []

        const userIds = await user_model.findById(req.user.id, { friend_requests: { $slice: [(((page ?? 1) - 1) * 20), 20] } }).select('friend_requests')

        if (userIds.friend_requests.length > 0)
            result = await user_model.find({ _id: { $in: userIds.friend_requests } }).select(baseUserKeys)

        console.log(result)
        console.log(userIds)
        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/my-blocked', verifyToken, async (req, res, next) => {

    try {

        const { page } = req.params

        var result = []

        const userIds = await user_model.findById(req.user.id, { block: { $slice: [(((page ?? 1) - 1) * 20), 20] } }).select('block')

        if (userIds.block.length > 0)
            result = await user_model.find({ _id: { $in: userIds.block } }).select(baseUserKeys)

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/my-followers', verifyToken, async (req, res, next) => {

    try {

        const { page } = req.params

        var result = []

        const userIds = await user_model.findById(req.user.id, { followers: { $slice: [(((page ?? 1) - 1) * 20), 20] } }).select('followers')

        if (userIds.followers.length > 0)
            result = await user_model.find({ _id: { $in: userIds.followers } }).select(baseUserKeys)

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/peer-friends/:userId', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const data = await Promise.all([
            user_model.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(req.params.userId) } }, {
                    $project: {
                        is_blocked: { $in: [req.user.id, '$block'] },
                        is_friend: { $in: [req.user.id, '$friends'] },
                        is_follower: { $in: [req.user.id, '$followers'] },
                        privacy_friend_list: '$privacy_friend_list',
                        friends: { $slice: ["$friends", (((page ?? 1) - 1) * 20), 20] }
                    }
                }]),
            user_model.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(req.user.id) } }, {
                    $project: {
                        is_blocked: { $in: [req.params.userId, '$block'] },
                        block: '$block',
                    }
                }])
        ])

        const peerData = data[0][0]
        const user = data[1][0]
        const isBlocked = peerData.is_blocked == true || user.is_blocked == true
        const isFriend = peerData.is_friend == true
        const isFollower = peerData.is_follower == true
        const friendsPrivacy = peerData.privacy_friend_list

        if (isBlocked) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        if ((req.user.id != req.params.userId && friendsPrivacy == 1) || (req.user.id != req.params.userId && friendsPrivacy == 3 & !isFriend) || (req.user.id != req.params.userId && friendsPrivacy == 4 & !isFollower) || (req.user.id != req.params.userId && friendsPrivacy == 5 & (req.user.id != req.params.userId && !isFriend || !isFollower))) return next({ 'status': 400, 'message': language == 'ar' ? 'لا تملك صلاحية لروئية هذه الصفحة' : 'You do not have permission to view this page' })

        if (peerData.friends.length == 0) return res.json({
            'status': true,
            'data': []
        })

        const users = await user_model.aggregate([
            { $match: { _id: { $in: peerData.friends.map(e => mongoose.Types.ObjectId(e)) } } }, {
                $project: {
                    first_name: '$first_name',
                    last_name: '$last_name',
                    profile_picture: '$profile_picture',
                    cover_picture: '$cover_picture',
                    is_blocked: { $in: [req.user.id, '$block'] },
                    is_blocked2: { $in: ['$_id', user.block] },
                }
            }])

        res.json({
            'status': true,
            'data': users
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/search-peer-friends/:userId', verifyToken, async (req, res, next) => {

    try {

        const { data } = req.body
        const { page } = req.query

        if (!data) return next('Bad Request')

        const searchResult = await user_model.find(
            {
                friends: { $in: [req.params.userId] },
                $or: [
                    {
                        first_name: { $regex: '.*' + data + '.*', $options: 'i' },
                    },
                    {
                        last_name: { $regex: '.*' + data + '.*', $options: 'i' },
                    }]
            }).skip((((page ?? 1) - 1) * 20)).limit(20).select('first_name last_name profile_picture cover_picture')

        res.json({
            'status': true,
            'data': searchResult,
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/peer-followers/:userId', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const data = await Promise.all([
            user_model.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(req.params.userId) } }, {
                    $project: {
                        is_blocked: { $in: [req.user.id, '$block'] },
                        is_friend: { $in: [req.user.id, '$friends'] },
                        is_follower: { $in: [req.user.id, '$followers'] },
                        privacy_follower_list: '$privacy_follower_list',
                        followers: { $slice: ["$followers", (((page ?? 1) - 1) * 20), 20] }
                    }
                }]),
            user_model.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(req.user.id) } }, {
                    $project: {
                        is_blocked: { $in: [req.params.userId, '$block'] },
                        block: '$block',
                    }
                }])
        ])

        const peerData = data[0][0]
        const user = data[1][0]
        const isBlocked = peerData.is_blocked == true || user.is_blocked == true
        const isFriend = peerData.is_friend == true
        const isFollower = peerData.is_follower == true
        const followersPrivacy = peerData.privacy_friend_list

        if (isBlocked) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        if ((req.user.id != req.params.userId && followersPrivacy == 1) || (req.user.id != req.params.userId && followersPrivacy == 3 & !isFriend) || (req.user.id != req.params.userId && followersPrivacy == 4 & !isFollower) || (req.user.id != req.params.userId && followersPrivacy == 5 & (req.user.id != req.params.userId && !isFriend || !isFollower))) return next({ 'status': 400, 'message': language == 'ar' ? 'لا تملك صلاحية لروئية هذه الصفحة' : 'You do not have permission to view this page' })

        if (peerData.followers.length == 0) return res.json({
            'status': true,
            'data': []
        })

        const users = await user_model.aggregate([
            { $match: { _id: { $in: peerData.followers.map(e => mongoose.Types.ObjectId(e)) } } }, {
                $project: {
                    first_name: '$first_name',
                    last_name: '$last_name',
                    profile_picture: '$profile_picture',
                    cover_picture: '$cover_picture',
                    is_blocked: { $in: [req.user.id, '$block'] }, // TODO search block
                    is_blocked2: { $in: ['$_id', user.block] },   // TODO search block
                }
            }])

        res.json({
            'status': true,
            'data': users
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/my-profile-viewers', verifyToken, async (req, res, next) => {

    try {

        const { page } = req.query

        const isSubscription = (await subscription_model.findOne({ user_id: req.user.id, sub_category_id: profileViewCategoryId })) != null

        if (!isSubscription) return next({ 'status': 400, 'message': 'not_subscription' })

        const viewers = await profile_view_model.find({ owner_id: req.user.id }).sort({ createdAt: -1 , _id: 1})
            .skip((((page ?? 1) - 1) * 20))
            .limit(20).select('user_id times updatedAt')


        if (viewers.length == 0) return res.json({
            'status': true,
            'data': []
        })

        const users = await user_model.find({ _id: { $in: viewers.map(e => e.user_id) } }).select('first_name last_name profile_picture cover_picture')

        for (const user of users) {

            for (const viewer of viewers) {
                if (user.id == viewer.user_id) {
                    user._doc.times = viewer.times
                    user._doc.last_time = viewer._doc.updatedAt
                    break
                }
            }
        }

        res.json({
            'status': true,
            'data': users
        })

    } catch (e) {

        next(e)
    }
})


export default router