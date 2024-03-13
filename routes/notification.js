import express from 'express'
import { verifyToken } from '../helper.js'
import notification_model from '../models/notification_model.js'
import sub_category_model from '../models/sub_category_model.js'
import subscription_model from '../models/subscription_model.js'
import user_model from '../models/user_model.js'

const router = express.Router()

router.get('/social', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const result = await notification_model.find({
            receiver_id: req.user.id,
            tab: 1,
        }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20)

        const userIds = []

        result.forEach(e => {
            if (e.user_id && !userIds.includes(e.user_id)) userIds.push(e.user_id)
        })

        var users = []
        if (userIds.length > 0)
            users = await user_model.find({ _id: { $in: userIds } }).select('first_name last_name profile_picture profile_picture')

        result.forEach(e => {
            e._doc.text = language == 'ar' ? e.text_ar : e.text_en

            delete e._doc.text_ar
            delete e._doc.text_en

            for (const user of users) {
                if (e.user_id == user.id) {
                    e._doc.sender = user
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

router.get('/service', verifyToken, async (req, res, next) => {

    try {
        const { language } = req.headers

        const { page } = req.query

        const result = await notification_model.find({
            receiver_id: req.user.id,
            tab: 2,
        }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20)

        const usersIds = [req.user.id]
        const subCategoriesIds = []

        result.forEach(e => {
            if (!usersIds.includes(e.user_id)) usersIds.push(e.user_id)
            if (!subCategoriesIds.includes(e.sub_category_id)) subCategoriesIds.push(e.sub_category_id)
        })

        const freeSubCategories = await sub_category_model.find({ _id: { $in: subCategoriesIds }, daily_price: 0 }).distinct('_id')

        const subscriptions = await subscription_model.find({ sub_category_id: { $in: subCategoriesIds }, user_id: { $in: usersIds } }).select('sub_category_id user_id')

        result.forEach(e => {
            e._doc.is_subscription = false

            for (const subscription of subscriptions) {
                if (freeSubCategories.includes(e.sub_category_id) || (subscription.sub_category_id == e.sub_category_id && (e.user_id == subscription.user_id || subscription.user_id == req.user.id))) {
                    e._doc.is_subscription = true
                    break
                }
            }

            e._doc.text = language == 'ar' ? e.text_ar : e.text_en

            delete e._doc.text_ar
            delete e._doc.text_en
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

router.get('/app', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const result = await notification_model.find({
            receiver_id: req.user.id,
            tab: 3,
        }).sort({ createdAt: -1 , _id: 1}).skip((((page ?? 1) - 1) * 20)).limit(20)

        result.forEach(e => {
            e._doc.text = language == 'ar' ? e.text_ar : e.text_en

            delete e._doc.text_ar
            delete e._doc.text_en
        })

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/set-as-read', verifyToken, async (req, res, next) => {
    try {

        const { id } = req.body

        if (!id) return next('Bad Request')

        await notification_model.updateOne({ _id: id, receiver_id: req.user.id }, { is_read: true })

        res.json({
            'status': true,
        })

    } catch (e) { next(e) }
})

router.delete('/:id', verifyToken, async (req, res, next) => {
    try {

        await notification_model.deleteOne({ _id: req.params.id, receiver_id: req.user.id, })

        res.json({
            'status': true,
        })

    } catch (e) { next(e) }
})

router.delete('/all/:tab', verifyToken, async (req, res, next) => {
    try {

        await notification_model.deleteMany({ tab: req.params.tab, receiver_id: req.user.id, })

        res.json({
            'status': true,
        })

    } catch (e) { next(e) }
})

router.get('/count', verifyToken, async (req, res, next) => {
    try {

        const result = await notification_model.find({ receiver_id: req.user.id, is_read: false }).count()

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) { next(e) }
})


router.get('/count-by-type', verifyToken, async (req, res, next) => {
    try {

        const result = await Promise.all([
            notification_model.find({ receiver_id: req.user.id, is_read: false, tab: 1 }).count(),
            notification_model.find({ receiver_id: req.user.id, is_read: false, tab: 2 }).count(),
            notification_model.find({ receiver_id: req.user.id, is_read: false, tab: 3 }).count(),
        ])

        res.json({
            'status': true,
            'data': {
                'social': result[0],
                'service': result[1],
                'app': result[2],
            },
        })

    } catch (e) { next(e) }
})
export default router