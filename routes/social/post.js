import express from 'express'
import post_model from '../../models/post_model.js'
import post_feeling_model from '../../models/post_feeling_model.js'
import post_activity_model from '../../models/post_activity_model.js'
import user_model from '../../models/user_model.js'
import mongoose from 'mongoose'

import { downloadFiles, uploadFilesRelease } from '../../controllers/s3_controller.js'

import { baseUserKeys, tryVerify, verifyToken } from '../../helper.js'
import post_comment_model from '../../models/post_comment_model.js'
import auth_model from '../../models/auth_model.js'
import notification_model from '../../models/notification_model.js'
import { sendNotifications } from '../../controllers/notification_controller.js'
import comment_replay_model from '../../models/comment_replay_model.js'

const router = express.Router()


router.get('/feelings', async (req, res, next) => {

    try {

        const { language } = req.headers

        const result = await post_feeling_model.find({})

        result.forEach(e => {
            e._doc.name = language == 'ar' ? e.name_ar : e.name_en

            delete e._doc.name_ar
            delete e._doc.name_en
        })

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/activities', async (req, res, next) => {

    try {

        const { language } = req.headers

        const result = await post_activity_model.find({})

        result.forEach(e => {
            e._doc.name = language == 'ar' ? e.name_ar : e.name_en

            delete e._doc.name_ar
            delete e._doc.name_en
        })

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/create', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { text, location, privacy, pictures, activity_id, feeling_id, tags, background, travel_from, travel_to } = req.body

        if (!privacy || (text.length == 0 && pictures.length == 0)) return next('Bad Request')

        if (background && text.length > 200) return next('Bad Request')

        const user = await user_model.findOne({ _id: req.user.id, is_locked: false }).select(baseUserKeys + ' friends')

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب ليس موجود' : 'The Account is not exist' })

        var activity = null
        var feeling = null

        if (activity_id) {
            activity = await post_activity_model.findById(activity_id)
            if (!activity) return next('Bad Request')
            activity._doc.name = language == 'ar' ? activity.name_ar : activity.name_en
            delete activity._doc.name_ar
            delete activity._doc.name_en
        }

        if (feeling_id) {
            feeling = await post_feeling_model.findById(feeling_id)
            if (!feeling) return next('Bad Request')
            feeling._doc.name = language == 'ar' ? feeling.name_ar : feeling.name_en
            delete feeling._doc.name_ar
            delete feeling._doc.name_en
        }

        const object = new post_model({
            user_id: req.user.id,
            text,
            privacy,
            pictures,
            location: location ?? undefined,
            activity_id: activity_id ?? undefined,
            feeling_id: feeling_id ?? undefined,
            tags: tags.filter(e => user.friends.includes(e)),
            background,
            travel_from,
            travel_to,
        })

        const result = await object.save()

        result._doc.tag_users = []

        const newPostTitleAr = 'منشور جديد'
        const newPostTitleEn = 'New Post'

        const newPostBodyAr = `قام ${user.first_name.trim()} ${user.last_name.trim()} بنشر منشور جديد`
        const newPostBodyEn = `${user.first_name.trim()} ${user.last_name.trim()} has posted a new Post`

        user.friends.forEach(e => {

            Promise.all([
                user_model.findById(e).select('language'),
                auth_model.find({ user_id: e }).distinct('fcm'),
            ]).then(data => {

                const friend = data[0]
                const fcm = data[1]

                if (friend && fcm) {
                    const notification = new notification_model({
                        receiver_id: friend.id,
                        user_id: user.id,
                        tab: 1,
                        text_ar: newPostBodyAr,
                        text_en: newPostBodyEn,
                        type: 1,
                        direction: result.id,
                    })

                    notification.save()

                    sendNotifications(
                        fcm,
                        friend.language == 'ar' ? newPostTitleAr : newPostTitleEn,
                        friend.language == 'ar' ? newPostBodyAr : newPostBodyEn,
                        1,
                        result.id,
                    )
                }
            })
        })

        if (result.tags) {


            for (const tag of result.tags) {

                const titleAr = 'إشارة جديدة'
                const titleEn = 'New Tag'

                const bodyAr = `قام ${user.first_name.trim()} ${user.last_name.trim()} بالإشارة إليك فى منشوره`
                const bodyEn = `${user.first_name.trim()} ${user.last_name.trim()} has tagged you on his Post`

                Promise.all([
                    user_model.findById(tag).select('language'),
                    auth_model.find({ user_id: tag }).distinct('fcm'),
                ]).then(data => {

                    const tagUser = data[0]
                    const fcm = data[1]

                    if (tagUser && fcm) {
                        const notification = new notification_model({
                            receiver_id: tagUser.id,
                            user_id: user.id,
                            tab: 1,
                            text_ar: bodyAr,
                            text_en: bodyEn,
                            type: 1,
                            direction: result.id,
                        })

                        notification.save()

                        sendNotifications(
                            fcm,
                            tagUser.language == 'ar' ? titleAr : titleEn,
                            tagUser.language == 'ar' ? bodyAr : bodyEn,
                            1,
                            result.id,
                        )
                    }
                })
            }
            result._doc.tag_users = await user_model.find({ _id: { $in: result.tags } }).select(baseUserKeys)
            delete result._doc.tags
        }


        delete user._doc.friends

        result._doc.user = user
        result._doc.feeling = feeling
        result._doc.activity = activity
        result._doc.total_comments = 0
        result._doc.total_shares = 0
        result._doc.total_likes = 0
        result._doc.total_wow = 0
        result._doc.total_angry = 0
        result._doc.total_sad = 0
        result._doc.total_love = 0
        result._doc.is_comments_enable = true


        res.json({
            'status': true,
            'data': result,
        })
    }
    catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/get-my-posts', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page, type } = req.query // type if 1 = posts , 2 = gallery

        const result = await post_model.find({
            text: type == 2 ? "" : { $ne: "" }, $or: [
                { user_id: req.user.id },
                { tags: { $in: req.user.id } }
            ]
        })
            .sort({ createdAt: -1, _id: 1 })
            .skip((((page ?? 1) - 1) * 20))
            .limit(20).select('text user_id location privacy pictures activity_id feeling_id comment_privacy background tags createdAt')


        if (result.length == 0) return res.json({ 'status': true, 'data': [] })

        const userIds = [req.user.id]
        const feelingIds = []
        const activityIds = []


        result.forEach(e => {
            if (e.feeling_id && !feelingIds.includes(e.feeling_id)) feelingIds.push(e.feeling_id)
            if (e.activity_id && !activityIds.includes(e.activity_id)) activityIds.push(e.activity_id)
            if (!userIds.includes(e.user_id)) userIds.push(e.user_id)
            if (e.tags) {
                e.tags.forEach(tag => {
                    if (!userIds.includes(tag)) userIds.push(tag)
                })
            }
        })

        const postsData = await Promise.all([
            post_feeling_model.find({ _id: { $in: feelingIds } }),
            post_activity_model.find({ _id: { $in: activityIds } }),
            post_model.aggregate([
                { $match: { _id: { $in: result.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
                    $project: {
                        total_likes: { $size: '$likes' },
                        total_wow: { $size: '$wow' },
                        total_angry: { $size: '$angry' },
                        total_sad: { $size: '$sad' },
                        total_love: { $size: '$love' },
                        total_shares: { $size: '$shares' },
                        is_like: { $in: [req.user.id, '$likes'] },
                        is_wow: { $in: [req.user.id, '$wow'] },
                        is_angry: { $in: [req.user.id, '$angry'] },
                        is_sad: { $in: [req.user.id, '$sad'] },
                        is_love: { $in: [req.user.id, '$love'] },
                    }
                }]),
            post_comment_model.aggregate([
                { $match: { post_id: { $in: result.map(e => e.id) } } },
                { $group: { _id: '$post_id', total: { $sum: 1 } }, },

            ]),
            user_model.find({ _id: { $in: userIds } }).select(baseUserKeys),
        ])

        result.forEach(post => {

            post._doc.total_comments = 0

            post._doc.is_comments_enable = true

            post._doc.tag_users = []

            for (const user of postsData[4]) {
                if (post.user_id == user.id) {
                    post._doc.user = user
                    break
                }
            }

            if (post.tags) {
                for (const tag of post.tags) {
                    for (const user of postsData[4]) {
                        if (tag == user.id) {
                            post._doc.tag_users.push(user)
                            break
                        }
                    }
                }
            }

            for (const feeling of postsData[0]) {
                if (feeling.id == post.feeling_id) {

                    if (!feeling._doc.name) {
                        feeling._doc.name = language == 'ar' ? feeling.name_ar : feeling.name_en
                        delete feeling._doc.name_ar
                        delete feeling._doc.name_en
                    }
                    post._doc.feeling = feeling
                    delete post._doc.feeling_id
                    break
                }
            }

            for (const activity of postsData[1]) {
                if (activity.id == post.activity_id) {

                    if (!activity._doc.name) {
                        activity._doc.name = language == 'ar' ? activity.name_ar : activity.name_en
                        delete activity._doc.name_ar
                        delete activity._doc.name_en
                    }
                    post._doc.activity = activity
                    delete post._doc.activity_id
                    break
                }
            }
            for (const reactions of postsData[2]) {
                if (reactions._id == post.id) {

                    post._doc.total_likes = reactions.total_likes
                    post._doc.total_wow = reactions.total_wow
                    post._doc.total_angry = reactions.total_angry
                    post._doc.total_sad = reactions.total_sad
                    post._doc.total_love = reactions.total_love
                    post._doc.total_shares = reactions.total_shares

                    post._doc.reaction = reactions.is_like ? 1 : reactions.is_love ? 2 : reactions.is_wow ? 3 : reactions.is_sad ? 4 : reactions.is_angry ? 5 : null
                    break
                }
            }

            for (const totalComments of postsData[3]) {
                if (totalComments._id == post.id) {
                    post._doc.total_comments = totalComments.total
                    break
                }
            }
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

router.put('/edit-my-post', verifyToken, async (req, res, next) => {

    try {

        const { post_id, text } = req.body

        if (!post_id || !text) return next('Bad Request')

        const result = await post_model.findOneAndUpdate({ _id: post_id, user_id: req.user.id }, { text }).select('_id')

        res.json({
            'status': result != null
        })

    } catch (e) {
        next(e)
    }
})

router.put('/edit-my-comment', verifyToken, async (req, res, next) => {

    try {

        const { comment_id, text } = req.body

        if (!comment_id || !text) return next('Bad Request')

        const result = await post_comment_model.findOneAndUpdate({ _id: comment_id, user_id: req.user.id }, { text }).select('_id')

        res.json({
            'status': result != null
        })

    } catch (e) {
        next(e)
    }
})

router.put('/edit-my-post-privacy', verifyToken, async (req, res, next) => {

    try {

        const { post_id, privacy } = req.body

        if (!post_id || !privacy) return next('Bad Request')

        const result = await post_model.findOneAndUpdate({ _id: post_id, user_id: req.user.id }, { privacy }).select('_id')

        res.json({
            'status': result != null
        })

    } catch (e) {
        next(e)
    }
})

router.put('/edit-comments-post-privacy', verifyToken, async (req, res, next) => {

    try {

        const { post_id, privacy } = req.body

        if (!post_id || !privacy) return next('Bad Request')

        const result = await post_model.findOneAndUpdate({ _id: post_id, user_id: req.user.id }, { comment_privacy: privacy }).select('_id')

        res.json({
            'status': result != null
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-total-reactions/:postId', tryVerify, async (req, res, next) => {

    try {

        const { language } = req.headers

        const post = await post_model.aggregate([{ $match: { _id: mongoose.Types.ObjectId(req.params.postId) } }, {
            $project: {
                total_likes: { $size: '$likes' },
                total_wow: { $size: '$wow' },
                total_angry: { $size: '$angry' },
                total_sad: { $size: '$sad' },
                total_love: { $size: '$love' },
            },
        }])

        if (!post) return next({ 'status': 404, 'message': language == 'ar' ? 'المنشور غير موجود' : 'Post Is not Exist' })

        res.json({
            'status': true,
            'data': post[0],
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-post-reactions/:postId', tryVerify, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page, type } = req.query

        const { user } = req

        var userIds = []

        var blockedUsers = []

        if (user)
            blockedUsers = await user_model.findById(user.id).distinct('block')

        const isPostExist = await (post_model.findById(req.params.postId).select('_id')) != null

        if (!isPostExist) return next({ 'status': 404, 'message': language == 'ar' ? 'المنشور غير موجود' : 'Post Is not Exist' })

        if (type == 1)
            userIds = (await post_model.findById(req.params.postId, { likes: { $likes: [(((page ?? 1) - 1) * 20), 20] } }).select('likes')).likes

        else if (type == 2)
            userIds = (await post_model.findById(req.params.postId, { love: { $love: [(((page ?? 1) - 1) * 20), 20] } }).select('love')).love

        else if (type == 3)
            userIds = (await post_model.findById(req.params.postId, { wow: { $wow: [(((page ?? 1) - 1) * 20), 20] } }).select('wow')).wow

        else if (type == 4)
            userIds = (await post_model.findById(req.params.postId, { sad: { $sad: [(((page ?? 1) - 1) * 20), 20] } }).select('sad')).sad

        else
            userIds = (await post_model.findById(req.params.postId, { angry: { $angry: [(((page ?? 1) - 1) * 20), 20] } }).select('angry')).angry

        if (userIds.length == 0) return res.json({
            'status': true,
            'data': []
        })

        const result = await user_model.find({ _id: { $in: userIds.filter(e => !blockedUsers.includes(e)) } }).select('first_name last_name profile_picture cover_picture')

        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }

})

router.get('/get-single/:postId', tryVerify, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { user } = req

        const post = await post_model.findById(req.params.postId).select('text user_id location privacy pictures tags background activity_id feeling_id comment_privacy createdAt')

        if (!post) return next({ 'status': 404, 'message': language == 'ar' ? 'المنشور غير موجود' : 'Post Is not Exist' })

        const userData = await user_model.findById(post.user_id).select('first_name last_name profile_picture cover_picture')

        if (!userData) return next({ 'status': 400, 'message': language == 'ar' ? 'الحساب ليس موجود' : 'The Account is not exist' })

        post._doc.user = userData

        if (post.feeling_id) {
            const feeling = await post_feeling_model.findById(post.feeling_id)
            if (feeling) {
                feeling._doc.name = language == 'ar' ? feeling.name_ar : feeling.name_en
                delete feeling._doc.name_ar
                delete feeling._doc.name_en
                post._doc.feeling = feeling
            }
        }

        if (post.activity_id) {
            const activity = await post_activity_model.findById(post.activity_id)
            if (activity) {
                activity._doc.name = language == 'ar' ? activity.name_ar : activity.name_en
                delete activity._doc.name_ar
                delete activity._doc.name_en
                post._doc.activity = activity
            }
        }

        const postData = await Promise.all(
            user ? [
                post_model.aggregate([{ $match: { _id: mongoose.Types.ObjectId(post.id) } }, {
                    $project: {
                        total_likes: { $size: '$likes' },
                        total_wow: { $size: '$wow' },
                        total_angry: { $size: '$angry' },
                        total_sad: { $size: '$sad' },
                        total_love: { $size: '$love' },
                        total_shares: { $size: '$shares' },

                        is_like: { $in: [user.id, '$likes'] },
                        is_wow: { $in: [user.id, '$wow'] },
                        is_angry: { $in: [user.id, '$angry'] },
                        is_sad: { $in: [user.id, '$sad'] },
                        is_love: { $in: [user.id, '$love'] },
                    },
                }]),
                post_comment_model.find({ post_id: post.id }).count(),
                user_model.aggregate([
                    { $match: { _id: mongoose.Types.ObjectId(user.id) } }, {
                        $project: {
                            is_blocked: { $in: [post.user_id, '$block'] },
                        }
                    }]),
                user_model.aggregate([
                    { $match: { _id: mongoose.Types.ObjectId(post.user_id) } }, {
                        $project: {
                            is_blocked: { $in: [user.id, '$block'] },
                            is_friend: { $in: [user.id, '$friends'] },
                            is_follower: { $in: [user.id, '$followers'] },
                        }
                    }])
            ] : [
                post_model.aggregate([
                    { $match: { _id: mongoose.Types.ObjectId(post.id) } }, {
                        $project: {
                            total_likes: { $size: '$likes' },
                            total_wow: { $size: '$wow' },
                            total_angry: { $size: '$angry' },
                            total_sad: { $size: '$sad' },
                            total_love: { $size: '$love' },
                            total_shares: { $size: '$shares' },

                        }
                    }]),
                post_comment_model.find({ post_id: post.id }).count(),
            ]
        )

        if (req.user.isAdmin == false && req.user.isSuperAdmin == false && ((user && postData[2][0].is_blocked) || (user && postData[3][0].is_blocked))) return next({ 'status': 404, 'message': language == 'ar' ? 'المنشور غير موجود' : 'Post Is not Exist' })


        var isFriend = false
        var isFollower = false
        var isPostOwner = false

        if (user) {

            isFriend = postData[3][0].is_friend
            isFollower = postData[3][0].is_follower
            isPostOwner = post.user_id == user.id
        }

        post._doc.is_comments_enable = isPostOwner || post.comment_privacy == 2 || (post.comment_privacy == 3 && isFriend) || (post.comment_privacy == 4 && isFollower) || (post.comment_privacy == 5 && (isFriend || isFollower))

        const reactions = postData[0][0]

        post._doc.total_likes = reactions.total_likes
        post._doc.total_wow = reactions.total_wow
        post._doc.total_angry = reactions.total_angry
        post._doc.total_sad = reactions.total_sad
        post._doc.total_love = reactions.total_love
        post._doc.total_shares = reactions.total_shares
        post._doc.total_comments = postData[1]

        post._doc.reaction = !user ? null : reactions.is_like ? 1 : reactions.is_love ? 2 : reactions.is_wow ? 3 : reactions.is_sad ? 4 : reactions.is_angry ? 5 : null

        if (post.tags) {
            post._doc.tag_users = await user_model.find({ _id: { $in: post.tags } }).select('first_name last_name profile_picture cover_picture')
            delete post._doc.tags
        }
        res.json({
            'status': true,
            'data': post,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.delete('/delete-my-post/:postId', verifyToken, async (req, res, next) => {

    try {

        const result = await post_model.findOneAndDelete({ _id: req.params.postId, user_id: req.user.id }).select('_id')

        if (result) {
            post_comment_model.deleteMany({ post_id: req.params.postId }).exec()
        }

        res.json({
            'status': result != null,
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/delete-comment', verifyToken, async (req, res, next) => {

    try {

        const { comment_id, post_id } = req.body

        if (!comment_id || !post_id) return next('Bad Request')

        var result = false

        result = (await post_comment_model.findOneAndDelete({ _id: comment_id, user_id: req.user.id }).select('_id') != null)

        if (!result) {
            const post = await post_model.findOne({ _id: post_id, user_id: req.user.id }).select('_id')
            if (post) {
                result = (await post_comment_model.findOneAndDelete({ _id: comment_id }).select('_id') != null)
            }
        }

        res.json({
            'status': result,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/react-on-post', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { post_id, user_id, reaction_id } = req.body

        if (!post_id || !user_id) return next('Bad Request')

        const data = await Promise.all([
            user_model.findOne({ _id: req.user.id, is_locked: false }).select('first_name last_name block'),
            user_model.findOne({ _id: user_id, is_locked: false }).select('first_name last_name block language'),
            post_model.findOneAndUpdate(
                { _id: post_id },
                { $pull: { likes: req.user.id, love: req.user.id, wow: req.user.id, sad: req.user.id, angry: req.user.id } }
            ).select('_id'),

        ])

        const user = data[0]
        const peer = data[1]
        const post = data[2]

        if (!user || !peer || !post || user.block.includes(user_id) || peer.block.includes(req.user.id)) return next({ 'status': 404, 'message': language == 'ar' ? 'المنشور غير موجود' : 'Post Is not Exist' })

        if (reaction_id != null) {

            await post_model.updateOne(
                { _id: post_id },
                {
                    $addToSet: reaction_id == 1 ? { likes: req.user.id } : reaction_id == 2 ? { love: req.user.id } : reaction_id == 3 ? { wow: req.user.id } : reaction_id == 4 ? { sad: req.user.id } : { angry: req.user.id }
                },
            ).exec()

            if (req.user.id != user_id && (await notification_model.findOne({ receiver_id: user_id, user_id: req.user.id, type: 1, direction: post.id })) == null) {

                const titleAr = 'إعجاب جديد على منشورك'
                const titleEn = 'New Like On Your Post'

                const bodyAr = `قام ${user.first_name.trim()} ${user.last_name.trim()} بالاعجاب على منشورك`
                const bodyEn = `${user.first_name.trim()} ${user.last_name.trim()} liked your post`

                const notifcationObject = new notification_model({
                    text_ar: bodyAr,
                    text_en: bodyEn,
                    receiver_id: user_id,
                    tab: 1,
                    user_id: req.user.id,
                    type: 1,
                    direction: post.id,
                })

                notifcationObject.save()

                auth_model.find({ user_id }).distinct('fcm').then(fcm => {
                    if (fcm.length > 0) {
                        sendNotifications(
                            fcm,
                            peer.language == 'ar' ? titleAr : titleEn,
                            peer.language == 'ar' ? bodyAr : bodyEn,
                            1,
                            post.id,
                        )
                    }
                })
            }
        }

        const reactions = await post_model.aggregate([{ $match: { _id: mongoose.Types.ObjectId(post_id) } }, {
            $project: {
                total_likes: { $size: '$likes' },
                total_wow: { $size: '$wow' },
                total_angry: { $size: '$angry' },
                total_sad: { $size: '$sad' },
                total_love: { $size: '$love' },
            },
        }])


        reactions[0].total_comments = await post_comment_model.find({ post_id }).count()

        res.json({
            'status': true,
            'data': reactions[0],
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/react-on-comment', verifyToken, async (req, res, next) => {

    try {

        const { post_id, comment_id, reaction_id } = req.body


        await post_comment_model.updateOne(
            { _id: comment_id, post_id },
            { $pull: { likes: req.user.id, love: req.user.id, wow: req.user.id, sad: req.user.id, angry: req.user.id } }
        )
        if (reaction_id != null)
            await post_comment_model.updateOne(
                { _id: comment_id, post_id },
                {
                    $addToSet: reaction_id == 1 ? { likes: req.user.id } : reaction_id == 2 ? { love: req.user.id } : reaction_id == 3 ? { wow: req.user.id } : reaction_id == 4 ? { sad: req.user.id } : { angry: req.user.id }
                },
            ).exec()

        const reactions = await post_comment_model.aggregate([{ $match: { _id: mongoose.Types.ObjectId(comment_id) } }, {
            $project: {
                total_likes: { $size: '$likes' },
                total_wow: { $size: '$wow' },
                total_angry: { $size: '$angry' },
                total_sad: { $size: '$sad' },
                total_love: { $size: '$love' },
            },
        }])
        res.json({
            'status': true,
            'data': reactions[0],
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/comment-on-post', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { post_id, user_id, text, picture } = req.body

        if (!post_id || !user_id || (!text && !picture)) return next('Bad Request')

        const postData = await Promise.all([
            user_model.findById(req.user.id).select('first_name last_name profile_picture cover_picture'),
            post_model.findOne({ _id: post_id, user_id }).select('_id'),
            user_model.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(req.user.id) } }, {
                    $project: {
                        is_blocked: { $in: [user_id, '$block'] },
                        language: '$language'
                    }
                }]),
            user_model.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(user_id) } }, {
                    $project: {
                        is_blocked: { $in: [req.user.id, '$block'] },
                    }
                }])
        ])

        const user = postData[0]

        const peer = postData[2]

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        const isPostExist = postData[1] != null

        const isBlocked = postData[2][0].is_blocked || postData[2][0].is_blocked

        if (!isPostExist || isBlocked) return next({ 'status': 404, 'message': language == 'ar' ? 'المنشور غير موجود' : 'Post Is not Exist' })


        const object = new post_comment_model({
            user_id: req.user.id,
            picture,
            text,
            post_id,
            post_owner_id: user_id,
        })

        const result = await object.save()


        if (req.user.id != user_id && (await notification_model.findOne({ receiver_id: user_id, user_id: req.user.id, type: 1, is_read: false, direction: post_id })) == null) {

            const titleAr = 'تعليق جديد على منشورك'
            const titleEn = 'New Comment On Your Post'

            const bodyAr = `قام ${user.first_name.trim()} ${user.last_name.trim()} بالتعليق على منشورك`
            const bodyEn = `${user.first_name.trim()} ${user.last_name.trim()} Commented on your Post`

            const notifcationObject = new notification_model({
                text_ar: bodyAr,
                text_en: bodyEn,
                receiver_id: user_id,
                tab: 1,
                user_id: req.user.id,
                type: 1,
                direction: post_id,
            })

            notifcationObject.save()

            auth_model.find({ user_id }).distinct('fcm').then(fcm => {
                if (fcm.length > 0) {
                    sendNotifications(
                        fcm,
                        peer.language == 'ar' ? titleAr : titleEn,
                        peer.language == 'ar' ? bodyAr : bodyEn,
                        1,
                        post_id,
                    )
                }
            })
        }

        result._doc.user = user
        result._doc.total_likes = 0
        result._doc.total_wow = 0
        result._doc.total_angry = 0
        result._doc.total_sad = 0
        result._doc.total_love = 0

        delete result._doc.likes
        delete result._doc.love
        delete result._doc.wow
        delete result._doc.sad
        delete result._doc.angry

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/get-post-comments/:postId', verifyToken, async (req, res, next) => {

    try {

        const { page } = req.query

        const blockedUserIds = await user_model.findById(req.user.id).distinct('block')

        const result = await post_comment_model.find({ post_id: req.params.postId, user_id: { $nin: blockedUserIds } }).sort({ createdAt: 1, _id: 1 })
            .skip((((page ?? 1) - 1) * 20))
            .limit(20).select('text user_id post_id picture createdAt')

        if (result.length == 0) return res.json({
            'status': true,
            'data': [],
        })

        const userIds = []

        result.forEach(e => {

            if (!userIds.includes(e.user_id)) userIds.push(e.user_id)
        })

        const commentsData = await Promise.all([
            user_model.find({ _id: { $in: userIds } }).select(baseUserKeys),
            post_comment_model.aggregate([
                { $match: { _id: { $in: result.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
                    $project: {
                        total_likes: { $size: '$likes' },
                        total_wow: { $size: '$wow' },
                        total_angry: { $size: '$angry' },
                        total_sad: { $size: '$sad' },
                        total_love: { $size: '$love' },
                        is_like: { $in: [req.user.id, '$likes'] },
                        is_wow: { $in: [req.user.id, '$wow'] },
                        is_angry: { $in: [req.user.id, '$angry'] },
                        is_sad: { $in: [req.user.id, '$sad'] },
                        is_love: { $in: [req.user.id, '$love'] },
                    }
                }]),


            user_model.aggregate([
                { $match: { _id: { $in: userIds.map(e => mongoose.Types.ObjectId(e)) } } }, {
                    $project: {
                        is_blocked: { $in: [req.user.id, '$block'] },
                    }
                }]),
            comment_replay_model.aggregate([
                {
                    $match: {
                        'comment_id': { $in: result.map(e => e.id) },
                    }
                },
                { $group: { _id: '$comment_id', total: { $sum: 1 } }, },
            ])
        ])

        const users = commentsData[0]
        const allReactions = commentsData[1]
        const replies = commentsData[3]

        for (const comment of result) {

            comment._doc.total_replies = 0
            for (const replay of replies) {
                if (replay._id == comment.id) {
                    comment._doc.total_replies = replay.total
                    break
                }
            }
            for (const user of users) {
                if (user.id == comment.user_id) {
                    comment._doc.user = user
                    break
                }
            }
            for (const reactions of allReactions) {
                if (reactions._id == comment.id) {
                    comment._doc.total_likes = reactions.total_likes
                    comment._doc.total_wow = reactions.total_wow
                    comment._doc.total_angry = reactions.total_angry
                    comment._doc.total_sad = reactions.total_sad
                    comment._doc.total_love = reactions.total_love
                    comment._doc.reaction = reactions.is_like ? 1 : reactions.is_love ? 2 : reactions.is_wow ? 3 : reactions.is_sad ? 4 : reactions.is_angry ? 5 : null

                    break
                }
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

router.post('/share-post', verifyToken, async (req, res, next) => {

    try {

        const { post_id } = req.body

        if (!post_id) return next('Bad Request')

        const result = await post_model.findOneAndUpdate({
            _id: post_id,
            shares: { $nin: req.user.id }
        }, { $addToSet: { shares: req.user.id } }).select('_id user_id')

        if (req.user.id != result.user_id && result != null) {

            const user = await user_model.findById(req.user.id).select('first_name last_name')

            const peer = await user_model.findById(result.user_id).select('language')

            const titleAr = 'مشاركة جديدة لمنشورك'
            const titleEn = 'New Share For Your Post'

            const bodyAr = `قام ${user.first_name.trim()} ${user.last_name.trim()} بمشاركة منشورك`
            const bodyEn = `${user.first_name.trim()} ${user.last_name.trim()} Shared your Post`

            const notifcationObject = new notification_model({
                text_ar: bodyAr,
                text_en: bodyEn,
                receiver_id: result.user_id,
                tab: 1,
                user_id: req.user.id,
                type: 1,
                direction: post_id,
            })

            notifcationObject.save()

            auth_model.find({ user_id: result.user_id }).distinct('fcm').then(fcm => {
                if (fcm.length > 0) {
                    sendNotifications(
                        fcm,
                        peer.language == 'ar' ? titleAr : titleEn,
                        peer.language == 'ar' ? bodyAr : bodyEn,
                        1,
                        post_id,
                    )
                }
            })

        }

        res.json({
            'status': result != null
        })

    } catch (e) {
        next(e)
    }
})

router.post('/hide-post', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { post_id } = req.body

        if (!post_id) return next('Bad Request')

        const post = await post_model.findById(post_id).select('id')

        if (!post) return next({ 'status': 404, 'message': language == 'ar' ? 'المنشور غير موجود' : 'Post Is not Exist' })

        const result = await user_model.findOneAndUpdate({
            _id: req.user.id,
        }, { $addToSet: { hide_posts: post_id } }).select('_id')

        res.json({
            'status': result != null
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-peer-posts/:peerId', tryVerify, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page, type } = req.query

        const { user } = req

        var isBlocked = false
        var isFriend = false
        var isFollower = false

        if (user) {
            const data = await Promise.all([
                user_model.aggregate([
                    { $match: { _id: mongoose.Types.ObjectId(req.params.peerId) } }, {
                        $project: {
                            is_blocked: req.user.isAdmin || req.user.isSuperAdmin ? false : { $in: [user.id, '$block'] },
                            is_friend: req.user.isAdmin || req.user.isSuperAdmin ? false : { $in: [user.id, '$friends'] },
                            is_follower: req.user.isAdmin || req.user.isSuperAdmin ? false : { $in: [user.id, '$followers'] },
                        }
                    }]),
                user_model.aggregate([
                    { $match: { _id: req.user.isAdmin == true || req.user.isSuperAdmin == true ? mongoose.Types.ObjectId() : mongoose.Types.ObjectId(user.id) } }, {
                        $project: {
                            is_blocked: { $in: [req.params.userId, '$block'] },
                            block: '$block',
                        }
                    }])
            ])
            const peerData = data[0][0]
            const userData = data[1][0]
            isBlocked = req.user.isAdmin == false && req.user.isSuperAdmin == false && (peerData.is_blocked == true || userData.is_blocked == true)
            isFriend = peerData.is_friend == true
            isFollower = peerData.is_follower == true
        }

        if (isBlocked) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        var result = []

        if (user && user.id == req.params.peerId) {
            result = await post_model.find({
                text: type == 2 ? "" : { $ne: "" }, $or: [
                    { user_id: req.user.id },
                    { tags: { $in: req.user.id } }
                ]
            })
                .sort({ createdAt: -1, _id: 1 })
                .skip((((page ?? 1) - 1) * 20))
                .limit(20).select('text user_id location privacy pictures activity_id feeling_id comment_privacy background tags createdAt')
        }
        else result = await post_model.find(isFriend && isFollower ?
            {
                user_id: req.params.peerId,
                text: type == 2 ? "" : { $ne: "" },
                $or: [
                    {
                        privacy: 3, // is Friend
                    },
                    {
                        privacy: 4, // is Follower
                    },
                    {
                        privacy: 5, // is Friend Or Follower
                    },
                    {
                        privacy: 2, // public
                    },
                ]
            } :
            isFriend ? {
                user_id: req.params.peerId,
                text: type == 2 ? "" : { $ne: "" },
                $or: [
                    {
                        privacy: 3, // is Friend
                    },
                    {
                        privacy: 5, // is Friend Or Follower
                    }, {
                        privacy: 2, // public
                    },]
            } : isFollower ? {
                user_id: req.params.peerId,
                text: type == 2 ? "" : { $ne: "" },
                $or: [
                    {
                        privacy: 4, // is Follower
                    },
                    {
                        privacy: 5, // is Friend Or Follower
                    }, {
                        privacy: 2, // public
                    }]
            } : {
                user_id: req.params.peerId,
                text: type == 2 ? "" : { $ne: "" },
                privacy: 2, // public
            })
            .sort({ createdAt: -1, _id: 1 })
            .skip((((page ?? 1) - 1) * 20))
            .limit(20).select('text user_id location privacy pictures activity_id feeling_id comment_privacy tags background createdAt')


        if (result.length == 0) return res.json({ 'status': true, 'data': [] })

        const feelingIds = []
        const activityIds = []
        const userIds = []

        result.forEach(e => {
            if (e.feeling_id && !feelingIds.includes(e.feeling_id)) feelingIds.push(e.feeling_id)
            if (e.activity_id && !activityIds.includes(e.activity_id)) activityIds.push(e.activity_id)
            if (e.tags) {
                e.tags.forEach(tag => {
                    if (!userIds.includes(tag)) userIds.push(tag)
                })
            }
        })

        const postsData = await Promise.all([
            user_model.findById(req.params.peerId).select('first_name last_name profile_picture cover_picture'),
            post_feeling_model.find({ _id: { $in: feelingIds } }),
            post_activity_model.find({ _id: { $in: activityIds } }),
            post_model.aggregate(user ? [
                { $match: { _id: { $in: result.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
                    $project: {
                        total_likes: { $size: '$likes' },
                        total_wow: { $size: '$wow' },
                        total_angry: { $size: '$angry' },
                        total_sad: { $size: '$sad' },
                        total_love: { $size: '$love' },
                        total_shares: { $size: '$shares' },
                        is_like: { $in: [user.id, '$likes'] },
                        is_wow: { $in: [user.id, '$wow'] },
                        is_angry: { $in: [user.id, '$angry'] },
                        is_sad: { $in: [user.id, '$sad'] },
                        is_love: { $in: [user.id, '$love'] },
                    }
                }] : [
                { $match: { _id: { $in: result.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
                    $project: {
                        total_likes: { $size: '$likes' },
                        total_wow: { $size: '$wow' },
                        total_angry: { $size: '$angry' },
                        total_sad: { $size: '$sad' },
                        total_love: { $size: '$love' },
                        total_shares: { $size: '$shares' },
                    }
                }]),
            post_comment_model.aggregate([
                { $match: { post_id: { $in: result.map(e => e.id) } } },
                { $group: { _id: '$post_id', total: { $sum: 1 } }, },
            ]),
            user_model.find({ _id: { $in: userIds } }).select(baseUserKeys)
        ])

        if (!postsData[0]) return next({ 'status': 400, 'message': language == 'ar' ? 'الحساب ليس موجود' : 'The Account is not exist' })

        result.forEach(post => {

            post._doc.total_comments = 0
            post._doc.user = postsData[0]
            post._doc.is_comments_enable = true
            post._doc.tag_users = []

            if (post.tags) {
                for (const tag of post.tags) {
                    for (const user of postsData[5]) {
                        if (tag == user.id) {
                            post._doc.tag_users.push(user)
                            break
                        }
                    }
                }
            }
            for (const feeling of postsData[1]) {
                if (feeling.id == post.feeling_id) {

                    if (!feeling._doc.name) {
                        feeling._doc.name = language == 'ar' ? feeling.name_ar : feeling.name_en
                        delete feeling._doc.name_ar
                        delete feeling._doc.name_en
                    }
                    post._doc.feeling = feeling
                    delete post._doc.feeling_id
                    break
                }
            }

            for (const activity of postsData[2]) {
                if (activity.id == post.activity_id) {

                    if (!activity._doc.name) {
                        activity._doc.name = language == 'ar' ? activity.name_ar : activity.name_en
                        delete activity._doc.name_ar
                        delete activity._doc.name_en
                    }
                    post._doc.activity = activity
                    delete post._doc.activity_id
                    break
                }
            }
            for (const reactions of postsData[3]) {
                if (reactions._id == post.id) {

                    post._doc.total_likes = reactions.total_likes
                    post._doc.total_wow = reactions.total_wow
                    post._doc.total_angry = reactions.total_angry
                    post._doc.total_sad = reactions.total_sad
                    post._doc.total_love = reactions.total_love
                    post._doc.total_shares = reactions.total_shares

                    post._doc.reaction = reactions.is_like ? 1 : reactions.is_love ? 2 : reactions.is_wow ? 3 : reactions.is_sad ? 4 : reactions.is_angry ? 5 : null
                    break
                }
            }

            for (const totalComments of postsData[4]) {
                if (totalComments._id == post.id) {
                    post._doc.total_comments = totalComments.total
                    break
                }
            }
        })

        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/get-global-posts', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const user = await user_model.findOne({ _id: req.user.id, is_locked: false }).select('hide_posts following friends')

        if (!user) return next({ 'status': 400, 'message': language == 'ar' ? 'الحساب ليس موجود' : 'The Account is not exist' })

        var friendAndFollowing = user.friends

        user.following.forEach(e => {
            if (!friendAndFollowing.includes(e)) friendAndFollowing.push(e)
        })

        const result = await post_model.find({
            _id: { $nin: user.hide_posts }, $or: [
                {
                    user_id: req.user.id,
                },
                {
                    privacy: 3, // is Friend
                    user_id: { $in: user.friends },
                },
                {
                    privacy: 5, // is Friend Or Follower
                    user_id: { $in: friendAndFollowing },
                }, {
                    privacy: 2, // public
                    user_id: { $in: friendAndFollowing },
                },
            ]
        })
            .sort({ createdAt: -1, _id: 1 })
            .skip((((page ?? 1) - 1) * 20))
            .limit(20).select('text user_id location privacy pictures background tags activity_id feeling_id comment_privacy createdAt')


        if (result.length == 0) return res.json({ 'status': true, 'data': [] })

        const userIds = []
        const feelingIds = []
        const activityIds = []

        result.forEach(e => {
            if (!userIds.includes(e.user_id)) userIds.push(e.user_id)
            if (e.feeling_id && !feelingIds.includes(e.feeling_id)) feelingIds.push(e.feeling_id)
            if (e.activity_id && !activityIds.includes(e.activity_id)) activityIds.push(e.activity_id)

            if (e.tags) {
                e.tags.forEach(tag => {
                    if (!userIds.includes(tag)) userIds.push(tag)
                })
            }
        })

        const postsData = await Promise.all([
            user_model.find({ _id: { $in: userIds } }).select('first_name last_name profile_picture cover_picture'),
            post_feeling_model.find({ _id: { $in: feelingIds } }),
            post_activity_model.find({ _id: { $in: activityIds } }),
            post_model.aggregate(user ? [
                { $match: { _id: { $in: result.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
                    $project: {
                        total_likes: { $size: '$likes' },
                        total_wow: { $size: '$wow' },
                        total_angry: { $size: '$angry' },
                        total_sad: { $size: '$sad' },
                        total_love: { $size: '$love' },
                        total_shares: { $size: '$shares' },

                        is_like: { $in: [user.id, '$likes'] },
                        is_wow: { $in: [user.id, '$wow'] },
                        is_angry: { $in: [user.id, '$angry'] },
                        is_sad: { $in: [user.id, '$sad'] },
                        is_love: { $in: [user.id, '$love'] },
                    }
                }] : [
                { $match: { _id: { $in: result.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
                    $project: {
                        total_likes: { $size: '$likes' },
                        total_wow: { $size: '$wow' },
                        total_angry: { $size: '$angry' },
                        total_sad: { $size: '$sad' },
                        total_love: { $size: '$love' },
                        total_shares: { $size: '$shares' },
                    }
                }]),
            post_comment_model.aggregate([
                { $match: { post_id: { $in: result.map(e => e.id) } } },
                { $group: { _id: '$post_id', total: { $sum: 1 } }, },

            ]),
        ])

        if (!postsData[0]) return next({ 'status': 400, 'message': language == 'ar' ? 'الحساب ليس موجود' : 'The Account is not exist' })

        result.forEach(post => {

            post._doc.total_comments = 0
            post._doc.is_comments_enable = true
            post._doc.tag_users = []

            for (const user of postsData[0]) {
                if (user.id == post.user_id) {
                    post._doc.user = user
                    break
                }
            }

            if (post.tags) {
                for (const tag of post.tags) {
                    for (const user of postsData[0]) {
                        if (tag == user.id) {
                            post._doc.tag_users.push(user)
                            break
                        }
                    }
                }
            }

            delete post._doc.tags

            for (const feeling of postsData[1]) {
                if (feeling.id == post.feeling_id) {

                    if (!feeling._doc.name) {
                        feeling._doc.name = language == 'ar' ? feeling.name_ar : feeling.name_en
                        delete feeling._doc.name_ar
                        delete feeling._doc.name_en
                    }
                    post._doc.feeling = feeling
                    delete post._doc.feeling_id
                    break
                }
            }

            for (const activity of postsData[2]) {
                if (activity.id == post.activity_id) {

                    if (!activity._doc.name) {
                        activity._doc.name = language == 'ar' ? activity.name_ar : activity.name_en
                        delete activity._doc.name_ar
                        delete activity._doc.name_en
                    }
                    post._doc.activity = activity
                    delete post._doc.activity_id
                    break
                }
            }
            for (const reactions of postsData[3]) {
                if (reactions._id == post.id) {

                    post._doc.total_likes = reactions.total_likes
                    post._doc.total_wow = reactions.total_wow
                    post._doc.total_angry = reactions.total_angry
                    post._doc.total_sad = reactions.total_sad
                    post._doc.total_love = reactions.total_love
                    post._doc.total_shares = reactions.total_shares

                    post._doc.reaction = reactions.is_like ? 1 : reactions.is_love ? 2 : reactions.is_wow ? 3 : reactions.is_sad ? 4 : reactions.is_angry ? 5 : null
                    break
                }
            }

            for (const totalComments of postsData[4]) {
                if (totalComments._id == post.id) {
                    post._doc.total_comments = totalComments.total
                    break
                }
            }
        })

        res.json({
            'status': true,
            'data': result.filter(e => e._doc.user != null),
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.delete('/remove-post-tag/:postId', verifyToken, async (req, res, next) => {

    try {

        await post_model.updateOne({ _id: req.params.postId }, { $pull: { tags: req.user.id } })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-comment-replies/:commentId', verifyToken, async (req, res, next) => {

    try {

        const { page } = req.query


        const blockedUserIds = await user_model.findById(req.user.id).distinct('block')

        const result = await comment_replay_model.find({ comment_id: req.params.commentId, user_id: { $nin: blockedUserIds } }).sort({ createdAt: 1, _id: 1 })
            .skip((((page ?? 1) - 1) * 20))
            .limit(20).select('text user_id picture video comment_id picture createdAt')

        if (result.length == 0) return res.json({
            'status': true,
            'data': [],
        })

        const userIds = []

        result.forEach(e => {

            if (!userIds.includes(e.user_id)) userIds.push(e.user_id)
        })

        const commentsData = await Promise.all([
            user_model.find({ _id: { $in: userIds } }).select(baseUserKeys),
            comment_replay_model.aggregate([
                { $match: { _id: { $in: result.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
                    $project: {
                        total_likes: { $size: '$likes' },
                        total_wow: { $size: '$wow' },
                        total_angry: { $size: '$angry' },
                        total_sad: { $size: '$sad' },
                        total_love: { $size: '$love' },
                        is_like: { $in: [req.user.id, '$likes'] },
                        is_wow: { $in: [req.user.id, '$wow'] },
                        is_angry: { $in: [req.user.id, '$angry'] },
                        is_sad: { $in: [req.user.id, '$sad'] },
                        is_love: { $in: [req.user.id, '$love'] },
                    }
                }]),
            user_model.aggregate([
                { $match: { _id: { $in: userIds.map(e => mongoose.Types.ObjectId(e)) } } }, {
                    $project: {
                        is_blocked: { $in: [req.user.id, '$block'] },
                    }
                }]),

        ])

        const users = commentsData[0]
        const allReactions = commentsData[1]

        for (const comment of result) {

            for (const user of users) {
                if (user.id == comment.user_id) {
                    comment._doc.user = user
                    break
                }
            }
            for (const reactions of allReactions) {
                if (reactions._id == comment.id) {
                    comment._doc.total_likes = reactions.total_likes
                    comment._doc.total_wow = reactions.total_wow
                    comment._doc.total_angry = reactions.total_angry
                    comment._doc.total_sad = reactions.total_sad
                    comment._doc.total_love = reactions.total_love
                    comment._doc.reaction = reactions.is_like ? 1 : reactions.is_love ? 2 : reactions.is_wow ? 3 : reactions.is_sad ? 4 : reactions.is_angry ? 5 : null

                    break
                }
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

router.post('/react-on-replay', verifyToken, async (req, res, next) => {

    try {

        const { replay_id, reaction_id } = req.body


        await comment_replay_model.updateOne(
            { _id: replay_id },
            { $pull: { likes: req.user.id, love: req.user.id, wow: req.user.id, sad: req.user.id, angry: req.user.id } }
        )
        if (reaction_id != null)
            await comment_replay_model.updateOne(
                { _id: replay_id },
                {
                    $addToSet: reaction_id == 1 ? { likes: req.user.id } : reaction_id == 2 ? { love: req.user.id } : reaction_id == 3 ? { wow: req.user.id } : reaction_id == 4 ? { sad: req.user.id } : { angry: req.user.id }
                },
            ).exec()

        const reactions = await comment_replay_model.aggregate([{ $match: { _id: mongoose.Types.ObjectId(replay_id) } }, {
            $project: {
                total_likes: { $size: '$likes' },
                total_wow: { $size: '$wow' },
                total_angry: { $size: '$angry' },
                total_sad: { $size: '$sad' },
                total_love: { $size: '$love' },
            },
        }]).limit(1)

        res.json({
            'status': true,
            'data': reactions[0],
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/replay-on-comment', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { post_id, comment_id, user_id, text, picture } = req.body

        if (!post_id || !comment_id || !user_id || (!text && !picture)) return next('Bad Request')

        const postData = await Promise.all([
            user_model.findById(req.user.id).select(baseUserKeys),
            post_comment_model.findOne({ _id: comment_id, user_id }).select('_id'),
            user_model.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(req.user.id) } }, {
                    $project: {
                        is_blocked: { $in: [user_id, '$block'] },
                        language: '$language'
                    }
                }]),
            user_model.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(user_id) } }, {
                    $project: {
                        is_blocked: { $in: [req.user.id, '$block'] },
                    }
                }])
        ])

        const user = postData[0]

        const peer = postData[2]

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        const isPostExist = postData[1] != null

        const isBlocked = postData[2][0].is_blocked || postData[2][0].is_blocked

        if (!isPostExist || isBlocked) return next({ 'status': 404, 'message': language == 'ar' ? 'التعليق غير موجود' : 'Comment Is not Exist' })


        const object = new comment_replay_model({
            user_id: req.user.id,
            picture,
            text,
            comment_id,
        })

        const result = await object.save()


        if (req.user.id != user_id && (await notification_model.findOne({ receiver_id: user_id, user_id: req.user.id, type: 1, is_read: false, direction: comment_id })) == null) {

            const titleAr = 'تعليق جديد على تعليقك'
            const titleEn = 'New Replay On Your Comment'

            const bodyAr = `قام ${user.first_name.trim()} ${user.last_name.trim()} بالتعليق على تعليقك`
            const bodyEn = `${user.first_name.trim()} ${user.last_name.trim()} Replayed on your Comment`

            const notifcationObject = new notification_model({
                text_ar: bodyAr,
                text_en: bodyEn,
                receiver_id: user_id,
                tab: 1,
                user_id: req.user.id,
                type: 1,
                direction: post_id,
            })

            notifcationObject.save()

            auth_model.find({ user_id }).distinct('fcm').then(fcm => {
                if (fcm.length > 0) {
                    sendNotifications(
                        fcm,
                        peer.language == 'ar' ? titleAr : titleEn,
                        peer.language == 'ar' ? bodyAr : bodyEn,
                        1,
                        post_id,
                    )
                }
            })
        }

        result._doc.user = user
        result._doc.total_likes = 0
        result._doc.total_wow = 0
        result._doc.total_angry = 0
        result._doc.total_sad = 0
        result._doc.total_love = 0

        delete result._doc.likes
        delete result._doc.love
        delete result._doc.wow
        delete result._doc.sad
        delete result._doc.angry

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.delete('/delete-replay', verifyToken, async (req, res, next) => {

    try {

        const { replay_id } = req.body

        if (!replay_id) return next('Bad Request')

        const result = (await comment_replay_model.findOneAndDelete({ _id: replay_id, user_id: req.user.id }).select('_id') != null)

        res.json({
            'status': result,
        })

    } catch (e) {
        next(e)
    }
})

export default router