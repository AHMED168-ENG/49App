import express from 'express'
import user_model from '../../models/user_model.js'
import { baseUserKeys, tryVerify, verifyToken, executeFFMPEG, publicIPAddress, filesCloudUrl } from '../../helper.js'
import { uploadSingleFile } from '../../controllers/s3_controller.js'
import song_model from '../../models/song_model.js'
import reel_model from '../../models/reel_model.js'
import mongoose from 'mongoose'
import wallet_model from '../../models/wallet_model.js'
import { v4 as uuidv4 } from 'uuid';
import path from 'path'
import download from 'download';

import fs from 'fs'
import post_comment_model from '../../models/post_comment_model.js'

const router = express.Router()
/*
router.get('/songs', async (req, res, next) => {

    try {

        const { page } = req.query

        const result = await song_model.find({}).sort({ createdAt: -1, _id: 1 })
            .skip((((page ?? 1) - 1) * 20))
            .limit(20)

        const userIds = []

        result.forEach(e => {
            if (e.owner_id && !userIds.includes(e.owner_id)) userIds.push(e.owner_id)
        })

        if (userIds.length > 0) {

            const users = await user_model.find({ _id: { $in: userIds }, is_locked: false }).select('first_name last_name profile_picture cover_picture')

            for (const song of result) {

                for (const user of users) {
                    if (song.owner_id == user.id) {
                        song._doc.user = user
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

router.post('/create', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { song_id, desc, is_reel, video_path, is_picture } = req.body

        if (desc && desc.length > 30) return next({ 'status': 400, 'message': language == 'ar' ? 'الحد الاقصى 30 حرف للوصف' : 'Maximum 30 Letter For Description' })

        const user = await user_model.findById(req.user.id).select('first_name last_name profile_picture cover_picture country_code')

        if (!user) return next({ 'status': 400, 'message': language == 'ar' ? 'الحساب ليس موجود' : 'The Account is not exist' })

        if (!video_path) return next('Bad Request')

        var song = null

        if (song_id) {
            song = await song_model.findOneAndUpdate({ _id: song_id }, { $inc: { times: is_reel ? 1 : 0 } }, { returnOriginal: false })
        }

        if (!fs.existsSync(`./public/files/${video_path}`)) return next('Not Found This Video')

        const thumbFileName = uuidv4() + uuidv4() + '.jpg'

        await executeFFMPEG('ffmpeg', `-i ./public/files/${video_path} -filter_complex select=between(t\\,0\\,59)*eq(pict_type\\,I) -vframes 1 -f image2 ./public/files/${thumbFileName}`)


        const videoUrl = await uploadSingleFile({
            path: `./public/files/${video_path}`,
            filename: video_path.split('/').pop(),
            mimetype: path.extname(video_path).replace('.', '')
        }, false)

        const thumbUrl = await uploadSingleFile({
            path: `./public/files/${thumbFileName}`,
            filename: thumbFileName.split('/').pop(),
            mimetype: path.extname(thumbFileName).replace('.', '')
        }, true)

        if (song && is_reel) {

            if (song.owner_id == req.user.id) {
                delete user._doc.country_code
                song._doc.user = user
            } else if (song.owner_id) {
                song._doc.user = await user_model.findOne({ _id: song.owner_id, is_locked: false }).select('first_name last_name profile_picture cover_picture')
            }
        }
        else if (is_reel && !is_picture) {

            song = await extractSong(`./public/files/${video_path}`, req.user.id)

            if (song) {
                if (song.owner_id == req.user.id) {
                    delete user._doc.country_code
                    song._doc.user = user
                } else {
                    song._doc.user = await user_model.findOne({ _id: song.owner_id, is_locked: false }).select('first_name last_name profile_picture cover_picture')
                }
            }
        }

        setTimeout(() => {
            try {
                fs.unlink(`./public/files/${video_path}`, () => { })
            } catch (e) { }
        }, 60000);


        const object = new reel_model({
            user_id: req.user.id,
            thumb_url: thumbUrl,
            video_url: videoUrl,
            is_reel,
            song_id: song != null ? song._id : null,
            song_owner_id: song != null ? song.owner_id : null,
            desc,
            country_code: is_reel ? user.country_code : null,
            expire_at: is_reel ? null : new Date().getTime(),
        })

        const result = await object.save()

        result._doc.total_likes = 0
        result._doc.total_shares = 0
        result._doc.total_views = 0
        result._doc.is_liked = false
        result._doc.is_viewed = false
        result._doc.user = user
        result._doc.song = song

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/my-reels-and-stories', verifyToken, async (req, res, next) => {

    try {

        const { page } = req.query


        const result = await reel_model.find({ user_id: req.user.id })
            .sort({ createdAt: -1 , _id: 1})
            .skip((((page ?? 1) - 1) * 20))
            .limit(20)
            .select('user_id song_id desc duration is_reel thumb_url video_url')

        if (result.length == 0) return res.json({ 'status': true, 'data': [] })

        const data = await Promise.all([
            user_model.findById(req.user.id).select('first_name last_name profile_picture cover_picture'),
            reel_model.aggregate([
                { $match: { _id: { $in: result.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
                    $project: {
                        total_likes: { $size: '$likes' },
                        total_views: { $size: '$views' },
                        total_shares: { $size: '$shares' },
                        is_liked: { $in: [req.user.id, '$likes'] },
                        is_viewed: { $in: [req.user.id, '$views'] },
                    }
                }])
        ])

        const reelsData = data[1]

        for (const reel of result) {

            reel._doc.user = data[0]

            for (const reelData of reelsData) {
                if (reel.id == reelData._id) {
                    reel._doc.total_likes = reelData.total_likes
                    reel._doc.total_views = reelData.total_views
                    reel._doc.total_shares = reelData.total_shares
                    reel._doc.is_liked = reelData.is_liked
                    reel._doc.is_viewed = reelData.is_viewed
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

router.get('/get-by-id/:id', tryVerify, async (req, res, next) => {

    try {

        const { language } = req.headers

        const result = await reel_model.findOne({ _id: req.params.reel }).select('user_id song_id desc duration is_reel thumb_url video_url')

        if (!result) return next({ 'status': 404, 'message': language == 'ar' ? 'الريل غير موجود' : 'Reel Is not Exist' })

        const data = await Promise.all([
            reel_model.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(result.id) } }, {
                    $project: {
                        total_likes: { $size: '$likes' },
                        total_views: { $size: '$views' },
                        total_shares: { $size: '$shares' },
                        is_liked: { $in: [req.user.id, '$likes'] },
                        is_viewed: { $in: [req.user.id, '$views'] },
                    }
                }]).limit(1),
            user_model.findById(result.user_id).select(baseUserKeys),
        ])

        const reelData = data[0]

        result._doc.is_liked = reelData[0][0].is_liked
        result._doc.is_viewed = reelData[0][0].is_viewed
        result._doc.total_likes = reelData[0][0].total_likes
        result._doc.total_views = reelData[0][0].total_views
        result._doc.total_shares = reelData[0][0].total_shares

        if (result.song_id) {
            result._doc.song = await song_model.findById(result.song_id)
            if (result._doc.song && result.song_owner_id) {
                result._doc.song.user = await user_model.findById(result.song_owner_id).select(baseUserKeys)
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

router.get('/peer-reels/:peerId', tryVerify, async (req, res, next) => {

    try {

        const { page } = req.query

        const { user } = req

        const result = await reel_model.find({ user_id: req.params.peerId, is_reel: true })
            .sort({ createdAt: -1 , _id: 1})
            .skip((((page ?? 1) - 1) * 20))
            .limit(20)
            .select('user_id song_id desc duration is_reel thumb_url video_url')

        if (result.length == 0) return res.json({ 'status': true, 'data': [] })

        const data = await Promise.all(user ? [
            user_model.findById(req.params.peerId).select(baseUserKeys),
            reel_model.aggregate([
                { $match: { _id: { $in: result.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
                    $project: {
                        total_likes: { $size: '$likes' },
                        total_views: { $size: '$views' },
                        total_shares: { $size: '$shares' },
                        is_liked: { $in: [user.id, '$likes'] },
                    }
                }])
        ] : [
            user_model.findById(req.params.peerId).select(baseUserKeys),
            reel_model.aggregate([
                { $match: { _id: { $in: result.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
                    $project: {
                        total_likes: { $size: '$likes' },
                        total_views: { $size: '$views' },
                        total_shares: { $size: '$shares' },
                    }
                }])
        ])

        const reelsData = data[1]

        for (const reel of result) {

            reel._doc.user = data[0]

            for (const reelData of reelsData) {
                if (reel.id == reelData._id) {
                    reel._doc.total_likes = reelData.total_likes
                    reel._doc.total_views = reelData.total_views
                    reel._doc.total_shares = reelData.total_shares
                    reel._doc.is_liked = reelData.is_liked ?? false
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

router.post('/add-view', verifyToken, async (req, res, next) => {

    try {

        const { id } = req.body

        if (!id) return next('Bad Request')

        reel_model.updateOne({ _id: id }, { $addToSet: { views: req.user.id } }).exec()

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/like', verifyToken, async (req, res, next) => {

    try {

        const { id } = req.body

        if (!id) return next('Bad Request')

        const existLiked = await reel_model.findOne({ _id: id, likes: { $nin: [req.user.id] } }).select('_id user_id')

        var isLiked = false

        if (existLiked) {
            isLiked = true
            reel_model.updateOne({ _id: id }, { $addToSet: { likes: req.user.id } }).exec()
            wallet_model.updateOne({ user_id: existLiked.user_id }, { $inc: { total_likes: 1, today_likes: 1 } }).exec()

        } else {

            const reelData = await reel_model.findOne({ _id: id }).select('_id user_id')

            reel_model.updateOne({ _id: id }, { $pull: { likes: req.user.id } }).exec()

            wallet_model.updateOne({ user_id: reelData.user_id }, { $inc: { total_likes: -1, today_likes: -1 } }).exec()
        }

        res.json({
            'status': isLiked,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/share', verifyToken, async (req, res, next) => {

    try {

        const { id } = req.body

        if (!id) return next('Bad Request')

        reel_model.updateOne({ _id: id }, { $addToSet: { shares: req.user.id } }).exec()

        res.json({
            'status': true,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/get-my-reel-views/:reelId', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const result = await reel_model.findOne({ _id: req.params.reelId, user_id: req.user.id }, { views: { $slice: [(((page ?? 1) - 1) * 20), 20] } }).select('views')

        if (!result) return next({ 'status': 404, 'message': language == 'ar' ? 'الريل غير موجود' : 'Reel Is not Exist' })

        if (result.views.length == 0) return res.json({ 'status': true, 'data': [] })

        const users = await user_model.find({ _id: { $in: result.views } }).select(baseUserKeys)

        res.json({
            'status': true,
            'data': users,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-my-reel-likes/:reelId', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const result = await reel_model.findOne({ _id: req.params.reelId, user_id: req.user.id }, { likes: { $slice: [(((page ?? 1) - 1) * 20), 20] } }).select('likes')

        if (!result) return next({ 'status': 404, 'message': language == 'ar' ? 'الريل غير موجود' : 'Reel Is not Exist' })

        if (result.likes.length == 0) return res.json({ 'status': true, 'data': [] })

        const users = await user_model.find({ _id: { $in: result.likes } }).select(baseUserKeys)

        res.json({
            'status': true,
            'data': users,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-my-reel-shares/:reelId', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const result = await reel_model.findOne({ _id: req.params.reelId, user_id: req.user.id }, { shares: { $slice: [(((page ?? 1) - 1) * 20), 20] } }).select('shares')

        if (!result) return next({ 'status': 404, 'message': language == 'ar' ? 'الريل غير موجود' : 'Reel Is not Exist' })

        if (result.shares.length == 0) return res.json({ 'status': true, 'data': [] })

        const users = await user_model.find({ _id: { $in: result.shares } }).select(baseUserKeys)

        res.json({
            'status': true,
            'data': users,
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/delete-my-reel', verifyToken, async (req, res, next) => {

    try {

        const { id } = req.body

        if (!id) return next('Bad Request')

        const result = await reel_model.findOneAndDelete({ _id: id, user_id: req.user.id }).select('_id')

        if (result && result.is_reel && result.song_id) {
            song_model.updateOne({ _id: result.song_id }, { $inc: { times: -1 } }).exec()
        }
        res.json({
            'status': result != null,
        })
    } catch (e) {
        next(e)
    }
})

router.get('/get-global-reels', tryVerify, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const { user } = req

        var result = []

        var blocked = []

        const pageSize = 20

        if (user) {

            const user = await user_model.findById(req.user.id).select('country_code block friends')

            if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'Account is Not Exist' })

            blocked = user.block

            var friends = user.friends

            var country_code = user.country_code

            result = await reel_model.aggregate([
                { $match: { is_reel: true, user_id: req.user.id/*, views: { $nin: [req.user.id] } } },
                {
                    $project: {
                        user_id: '$user_id',
                        song_id: '$song_id',
                        desc: '$desc',
                        duration: '$duration',
                        is_reel: '$is_reel',
                        thumb_url: '$thumb_url',
                        video_url: '$video_url',
                        total_likes: { $size: '$likes' },
                        total_views: { $size: '$views' },
                        total_shares: { $size: '$shares' },
                        is_liked: { $in: [user.id ?? null, '$likes'] },
                        is_viewed: { $in: [user.id ?? null, '$views'] },
                        createdAt: '$createdAt',
                    }
                },
                { $sort: { is_viewed: 1, createdAt: -1 , _id: 1} }
            ])
                .skip((((page ?? 1) - 1) * pageSize))
                .limit(pageSize)

            if (result.length < pageSize) {
                const newResult = await reel_model.aggregate([
                    { $match: { is_reel: true, user_id: { $in: friends }, _id: { $nin: result.map(e => mongoose.Types.ObjectId(e._id)) },/*, views: { $nin: [req.user.id] } } },
                    {
                        $project: {
                            user_id: '$user_id',
                            song_id: '$song_id',
                            desc: '$desc',
                            duration: '$duration',
                            is_reel: '$is_reel',
                            thumb_url: '$thumb_url',
                            video_url: '$video_url',
                            total_likes: { $size: '$likes' },
                            total_views: { $size: '$views' },
                            total_shares: { $size: '$shares' },
                            is_liked: { $in: [user.id ?? null, '$likes'] },
                            is_viewed: { $in: [user.id ?? null, '$views'] },
                        }
                    }])
                    .sort({ createdAt: -1 , _id: 1})
                    .skip((((page ?? 1) - 1) * (pageSize - result.length)))
                    .limit(pageSize)

                result = [...result, ...newResult]
            }

            if (result.length < pageSize) {

                const newResult = await reel_model.aggregate([
                    { $match: { is_reel: true, country_code, _id: { $nin: result.map(e => mongoose.Types.ObjectId(e._id)) }, user_id: { $nin: blocked }/*, views: { $nin: [req.user.id] } } },
                    {
                        $project: {
                            user_id: '$user_id',
                            song_id: '$song_id',
                            desc: '$desc',
                            duration: '$duration',
                            is_reel: '$is_reel',
                            thumb_url: '$thumb_url',
                            video_url: '$video_url',
                            total_likes: { $size: '$likes' },
                            total_views: { $size: '$views' },
                            total_shares: { $size: '$shares' },
                            is_liked: { $in: [user.id ?? null, '$likes'] },
                            is_viewed: { $in: [user.id ?? null, '$views'] },
                        }
                    }])
                    .sort({ createdAt: -1 , _id: 1})
                    .skip((((page ?? 1) - 1) * (pageSize - result.length)))
                    .limit(pageSize)

                result = [...result, ...newResult]

            }
        }

        if (result.length < pageSize) {

            if (user) {
                const newResult = await reel_model.aggregate([
                    { $match: { is_reel: true, _id: { $nin: result.map(e => mongoose.Types.ObjectId(e._id)) }, user_id: { $nin: blocked }/*, views: { $nin: [user.id ?? null] }  } },
                    {
                        $project: {
                            user_id: '$user_id',
                            song_id: '$song_id',
                            desc: '$desc',
                            duration: '$duration',
                            is_reel: '$is_reel',
                            thumb_url: '$thumb_url',
                            video_url: '$video_url',
                            total_likes: { $size: '$likes' },
                            total_views: { $size: '$views' },
                            total_shares: { $size: '$shares' },
                            is_liked: { $in: [user.id ?? null, '$likes'] },
                            is_viewed: { $in: [user.id ?? null, '$views'] },
                        }
                    }])
                    .sort({ createdAt: -1, _id: 1 })
                    .skip((((page ?? 1) - 1) * (pageSize - result.length)))
                    .limit(pageSize)
                result = [...result, ...newResult]

            }
            else {
                const newResult = await reel_model.aggregate([
                    { $match: { is_reel: true, _id: { $nin: result.map(e => mongoose.Types.ObjectId(e._id)) } } },
                    {
                        $project: {
                            user_id: '$user_id',
                            song_id: '$song_id',
                            desc: '$desc',
                            duration: '$duration',
                            is_reel: '$is_reel',
                            thumb_url: '$thumb_url',
                            video_url: '$video_url',
                            total_likes: { $size: '$likes' },
                            total_views: { $size: '$views' },
                            total_shares: { $size: '$shares' },
                        }
                    }])
                    .sort({ createdAt: -1, _id: 1 })
                    .skip((((page ?? 1) - 1) * (pageSize - result.length)))
                    .limit(pageSize)
                result = [...result, ...newResult]

            }
        }

        if (result.length == 0) return res.json({ 'status': true, 'data': [], })

        const userIds = []
        const songIds = []
        result.forEach(e => {
            if (!userIds.includes(e.user_id))
                userIds.push(e.user_id)
            if (!userIds.includes(e.song_owner_id))
                userIds.push(e.song_owner_id)
            if (e.song_id && !songIds.includes(e.song_id))
                songIds.push(e.song_id)
        }
        )

        const data = await Promise.all([
            user_model.find({ _id: { $in: userIds } }).select(baseUserKeys),
            song_model.find({ _id: { $in: songIds } }),

        ])
        const reelsUsers = data[0]
        const reelsSongs = data[1]

        for (const reel of result) {

            reel.is_liked = reel.is_liked ?? false
            reel.is_viewed = reel.is_viewed ?? false
            for (const user of reelsUsers) {
                if (user.id == reel.user_id) {
                    reel.user = user
                    break
                }
            }

            for (const song of reelsSongs) {
                if (song.id == reel.song_id) {
                    if (song.owner_id) {
                        for (const user of reelsUsers) {
                            if (user.id == song.owner_id) {
                                song._doc.user = user
                                break
                            }
                        }
                    }
                    reel.song = song
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

router.get('/get-song-trend/:songId', tryVerify, async (req, res, next) => {

    try {

        const { user } = req

        const { page } = req.query

        var blocked = []

        if (user) {
            blocked = await user_model.findById(req.user.id).distinct('block')
        }

        const reels = await reel_model.aggregate([
            { $match: { song_id: req.params.songId, is_reel: true, user_id: { $nin: blocked } } },
            {
                $project: {
                    total_views: { $size: '$views' },
                    user_id: '$user_id',
                    song_id: '$song_id',
                    desc: '$desc',
                    duration: '$duration',
                    is_reel: '$is_reel',
                    thumb_url: '$thumb_url',
                    video_url: '$video_url',
                    total_likes: { $size: '$likes' },
                    total_views: { $size: '$views' },
                    total_shares: { $size: '$shares' },
                    is_liked: { $in: [user.id ?? null, '$likes'] },
                    is_viewed: { $in: [user.id ?? null, '$views'] }
                }
            },
            { "$sort": { "total_views": -1 , "_id": 1} },
        ]).skip((((page ?? 1) - 1) * 20)).limit(20)

        if (reels.length == 0) return res.json({
            'status': true,
            'data': []
        })

        const userIds = []
        reels.forEach(e => {
            if (!userIds.includes(e.user_id))
                userIds.push(e.user_id)
        }
        )

        const reelsUsers = await user_model.find({ _id: { $in: userIds } }).select(baseUserKeys)

        for (const reel of reels) {

            reel.is_liked = reel.is_liked ?? false

            for (const user of reelsUsers) {
                if (user.id == reel.user_id) {
                    reel.user = user
                    break
                }
            }
        }

        res.json({
            'status': true,
            'data': reels,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/get-stories', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        var result = []

        const user = await user_model.findById(req.user.id).select('friends')

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'Account is Not Exist' })

        var friends = user.friends

        result = await reel_model.aggregate([
            { $match: { is_reel: false, user_id: req.user.id } }, // My Stories
            {
                $project: {
                    user_id: '$user_id',
                    song_id: '$song_id',
                    desc: '$desc',
                    duration: '$duration',
                    is_reel: '$is_reel',
                    thumb_url: '$thumb_url',
                    video_url: '$video_url',
                    total_likes: { $size: '$likes' },
                    total_views: { $size: '$views' },
                    total_shares: { $size: '$shares' },
                    is_liked: { $in: [req.user.id, '$likes'] },
                    is_viewed: { $in: [req.user.id, '$views'] },
                }
            }])
            .sort({ createdAt: -1 , _id: 1})
            .skip((((page ?? 1) - 1) * 20))
            .limit(20)

        if (result.length == 0) {

            result = await reel_model.aggregate([
                { $match: { is_reel: false, user_id: { $in: friends } } }, // Friends Stories
                {
                    $project: {
                        user_id: '$user_id',
                        song_id: '$song_id',
                        desc: '$desc',
                        duration: '$duration',
                        is_reel: '$is_reel',
                        thumb_url: '$thumb_url',
                        video_url: '$video_url',
                        total_likes: { $size: '$likes' },
                        total_views: { $size: '$views' },
                        total_shares: { $size: '$shares' },
                        is_liked: { $in: [req.user.id, '$likes'] },
                        is_viewed: { $in: [req.user.id, '$views'] },
                    }
                }])
                .sort({ createdAt: -1 , _id: 1})
                .skip((((page ?? 1) - 1) * 20))
                .limit(20)
        }

        if (result.length == 0) return res.json({ 'status': true, 'data': [], })

        const userIds = []

        result.forEach(e => { if (!userIds.includes(e.user_id)) userIds.push(e.user_id) })

        const reelsUsers = await user_model.find({ _id: { $in: userIds } }).select(baseUserKeys)

        for (const reel of result) {

            for (const user of reelsUsers) {
                if (user.id == reel.user_id) {
                    reel.user = user
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

router.post('/merge-picture-with-song', async (req, res, next) => {

    try {

        const { song_id, duration, path } = req.body

        if (duration > 60 || !path) return next('Bad Request')

        var songUrl = null

        if (song_id) {
            const song = await song_model.findById(song_id).select('play_url')
            if (song) songUrl = filesCloudUrl + song.play_url
        }

        const picturePath = `./public/files/${uuidv4() + uuidv4()}.png`

        fs.writeFileSync(picturePath, await download(filesCloudUrl + path))

        const fileName = uuidv4() + uuidv4() + '.mp4'
        const tempFileName = uuidv4() + uuidv4() + '.mp4'

        const reelTempUrl = `http://${publicIPAddress}/files/${fileName}`

        //const reelTempUrl = `http://192.168.1.6:3000/files/${fileName}`

        if (songUrl)
            await executeFFMPEG('ffmpeg', `-loop 1 -i ${picturePath} -i ${songUrl} -shortest -acodec copy -vcodec mjpeg ./public/files/${tempFileName}`)
        else
            await executeFFMPEG('ffmpeg', `-loop 1 -i ${picturePath} -shortest -acodec copy -t 0${duration == 60 ? 1 : 0}:${duration == 60 ? 0 : duration} -vcodec mjpeg ./public/files/${tempFileName}`)

        await executeFFMPEG('ffmpeg', `-y -i ./public/files/${tempFileName} -i ./public/files/logo.png -filter_complex overlay=x=main_w-overlay_w-(main_w*0.01):y=main_h-overlay_h-(main_h*0.01) ./public/files/${fileName}`)


        fs.unlink(`./public/files/${picturePath}`, () => { })
        fs.unlink(`./public/files/${tempFileName}`, () => { })
        setTimeout(() => {
            fs.unlink(`./public/files/${fileName}`, () => { })
        }, 600000);



        res.json({
            'status': true,
            'data': reelTempUrl,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/trimmed-video', verifyToken, async (req, res, next) => {

    try {

        const { song_id, start_time, end_time, duration, video_path } = req.body

        var songUrl = null

        if (!start_time || !end_time || !duration) return next('Bad Request')

        if (song_id) {
            songUrl = (await song_model.findById(song_id).select('play_url')).play_url
        }

        const videoPath = `./public/files/${uuidv4() + uuidv4()}.mp4`

        fs.writeFileSync(videoPath, await download(filesCloudUrl + video_path))

        const fileName = uuidv4() + uuidv4() + '.mp4'
        const tempFileName = uuidv4() + uuidv4() + '.mp4'

        const reelTempUrl = `http://${publicIPAddress}/files/${fileName}`

        //const reelTempUrl = `http://192.168.1.6:3000/files/${fileName}`

        if (songUrl) {

            const otherTempFileName = uuidv4() + uuidv4() + '.mp4'

            await executeFFMPEG('ffmpeg', `-i ${videoPath} -ss ${start_time} -t ${end_time} -async 1 ./public/files/${otherTempFileName}`)
            await executeFFMPEG('ffmpeg', `-y -i ./public/files/${otherTempFileName} -i ${filesCloudUrl}${songUrl} -map 0:v -map 1:a -t 00:${duration} -c:v copy ./public/files/${tempFileName}`)
            fs.unlink(`./public/files/${otherTempFileName}`, () => { })

        } else {
            await executeFFMPEG('ffmpeg', `-i ${videoPath} -ss ${start_time} -t ${end_time} -async 1 ./public/files/${tempFileName}`)

        }

        await executeFFMPEG('ffmpeg', `-y -i ./public/files/${tempFileName} -i ./public/files/logo.png -filter_complex overlay=x=main_w-overlay_w-(main_w*0.01):y=main_h-overlay_h-(main_h*0.01) ./public/files/${fileName}`)


        fs.unlink(`./public/files/${videoPath}`, () => { })
        fs.unlink(`./public/files/${tempFileName}`, () => { })
        setTimeout(() => {
            fs.unlink(`./public/files/${fileName}`, () => { })
        }, 600000);

        console.log(reelTempUrl)
        res.json({
            'status': true,
            'data': reelTempUrl,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/comment-on-reel', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { reel_id, user_id, text, picture } = req.body

        if (!reel_id || !user_id || (!text && !picture)) return next('Bad Request')

        const reelData = await Promise.all([
            user_model.findById(req.user.id).select('first_name last_name profile_picture cover_picture'),
            reel_model.findOne({ _id: reel_id, user_id }).select('_id'),
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

        const user = reelData[0]

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        const isReelExist = reelData[1] != null

        const isBlocked = reelData[2][0].is_blocked || reelData[2][0].is_blocked

        if (!isReelExist || isBlocked) return next({ 'status': 404, 'message': language == 'ar' ? 'مقطع الفيديو الفصير غير موجود' : 'Reel Is not Exist' })


        const object = new post_comment_model({
            user_id: req.user.id,
            picture,
            text,
            post_id: reel_id,
            post_owner_id: user_id,
        })

        const result = await object.save()

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

async function extractSong(videoPath, userId) {

    try {

        const extractSongName = uuidv4() + uuidv4() + '.mp3'
        await executeFFMPEG('ffmpeg', `-i ${videoPath} -q:a 0 -map a ./public/files/${extractSongName}`) // extract audio

        const durationResult = await executeFFMPEG('ffprobe', `-i ./public/files/${extractSongName} -v quiet -show_entries format=duration -hide_banner -of default=noprint_wrappers=1:nokey=1`) // get duration
        const duration = parseFloat(durationResult[1])

        const songUrl = await uploadSingleFile({
            path: `./public/files/${extractSongName}`,
            filename: extractSongName.split('/').pop(),
            mimetype: path.extname(extractSongName).replace('.', '')
        }, true)

        const songObject = new song_model({
            owner_id: userId,
            play_url: songUrl,
            duration: duration * 1000,
            name: uuidv4(),
            times: 1,
        })


        const result = await songObject.save()

        return result

    } catch (e) {
        console.log(e)
        return null
    }
}*/
export default router