import express from 'express'
import { sendNotifications } from '../../controllers/notification_controller.js'
import { verifyToken } from '../../helper.js'
import auth_model from '../../models/auth_model.js'
import hidden_opinion_model from '../../models/hidden_opinion_model.js'
import notification_model from '../../models/notification_model.js'
import user_model from '../../models/user_model.js'
const router = express.Router()

router.get('/', verifyToken, async (req, res, next) => {

    try {

        const { page } = req.query

        const result = await hidden_opinion_model.find({ receiver_id: req.user.id }).sort({ createdAt: -1 , _id: 1}).skip((((page ?? 1) - 1) * 20)).limit(20).select('text is_male createdAt')

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})


router.post('/', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { text, receiver_id } = req.body

        if (!text || !receiver_id) return next('Bad Request')

        const user = await user_model.findById(req.user.id).select('is_male')

        const receiver = await user_model.findById(receiver_id).select('language')

        if (!user || !receiver) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        const object = new hidden_opinion_model({
            user_id: req.user.id,
            receiver_id,
            text,
            is_male: user.is_male
        })

        object.save()

        const titleAr = 'رسالة من مجهول'
        const titleEn = 'a message from an unknown'

        const bodyAr = `شخص مجهول أرسل لك رسالة جديدة`
        const bodyEn = `an unknown person sent you a new message`

        const notifcationObject = new notification_model({
            text_ar: bodyAr,
            text_en: bodyEn,
            receiver_id: receiver_id,
            tab: 1,
            type: 6,
        })

        notifcationObject.save()

        auth_model.find({ user_id: receiver_id }).distinct('fcm').then(fcm => {
            if (fcm) {
                sendNotifications(
                    fcm,
                    receiver.language == 'ar' ? titleAr : titleEn,
                    receiver.language == 'ar' ? bodyAr : bodyEn,
                    6,
                )
            }
        })

        res.json({
            'status': true
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})


export default router