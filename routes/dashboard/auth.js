import express from 'express'
import { createToken, decryptText } from '../../helper.js'
import { v4 as uuidv4 } from 'uuid';
import admin_model from '../../models/admin_model.js';
import admin_fcm_model from '../../models/admin_fcm_model.js';
import { addAdminFcm } from '../../controllers/notification_controller.js';

const router = express.Router()


router.get('/test', (req, res, next) => {
    res.json({ 'status': true })
})

router.post('/login', async (req, res, next) => {

    try {

        const { username, password, fcm } = req.body

        if (!username || !password) return next('Bad Request')

        if (process.env.SUPER_ADMIN_USERNAME == username && process.env.SUPER_ADMIN_PASSWORD == password) {
            if (fcm) {
                addAdminFcm(fcm);
            }
            return res.json({
                'status': true, 'data': {
                    'token': createToken('super-admin', uuidv4(), new Date().toISOString(), true, false),
                    'is_super_admin': true,
                }
            })
        } else {
            const admin = await admin_model.findOne({ username })

            if (!admin || decryptText(admin.password) != password) return next({ 'status': false, 'message': 'Invalid Info' })
            if (fcm) {
                addAdminFcm(fcm);
            }
            return res.json({
                'status': true, 'data': {
                    'token': createToken(admin.id, uuidv4(), new Date().toISOString(), false, true),
                }
            })
        }

        //return next({ 'status': false, 'message': 'Invalid Info' })
    } catch (e) {
        next(e)
    }
})


export default router