import express from 'express'
import { verifyToken } from '../helper.js'
import notification_model from '../models/notification_model.js'
import sub_category_model from '../models/sub_category_model.js'
import subscription_model from '../models/subscription_model.js'
import user_model from '../models/user_model.js'

import {getServiceActivities, getSocialActivities} from '../controllers/activity_controller.js'


/*-------------------Middleware-------------------*/
import { isAuthenticated } from "../middleware/is-authenticated.js";
import { isAuthorized } from "../middleware/is-authorized.js";

const router = express.Router()

router.get('/social', isAuthenticated, getSocialActivities)

router.get('/service', isAuthenticated, getServiceActivities)

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