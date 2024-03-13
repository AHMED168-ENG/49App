import express from 'express'
import app_manager_model from '../models/app_manager_model.js'
import { baseUserKeys, verifyToken, verifyTokenAndSuperAdmin } from '../helper.js';
import monthly_contest_model from '../models/monthly_contest_model.js';
import user_model from '../models/user_model.js';
import { sendNotificationToAdmin } from '../controllers/notification_controller.js';

const router = express.Router()

router.get('/info', async (req, res, next) => {
    try {

        const result = await app_manager_model.findOne({}).select('is_monthly_contest_available monthly_contest_fees monthly_contest_reward instant_pay_number').exec();

        res.json({
            'status': true,
            'data': result,
        })
    } catch (e) {
        next(e)
    }
})

router.post('/subscribe-monthly-contest', verifyToken, async (req, res, next) => {
    try {
        const { ad_id, phone } = req.body

        const now = new Date();
        const item = new monthly_contest_model({
            user_id: req.user.id,
            ad_id,
            phone,
            date: (now.getFullYear() + 1) + '-' + now.getMonth(),
        });
        await item.save();
        sendNotificationToAdmin(
            'New Monthly Contest Subscription',
            `User ${req.user.id} has subscribed to the monthly contest`,
        )
        return res.json({
            status: true,
            message: 'تم الاشتراك بنجاح',
        })
    } catch (e) {
        next(e)
    }
})
export default router