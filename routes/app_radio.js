
import express from 'express'
import { baseUserKeys } from '../helper.js'
import app_radio_model from '../models/app_radio_model.js'
import user_model from '../models/user_model.js'

const router = express.Router()

router.get('/', async (req, res, next) => {

    try {

        const { page, category } = req.query

        const result = await app_radio_model.find({ is_active: true, category })
            .sort({ createdAt: -1, _id: 1 })
            .skip((((page ?? 1) - 1) * 20))
            .limit(20)

        const userIds = result.filter(e => e.user_id).map(e => e.user_id)

        if (userIds.length == 0) return res.json({ 'status': true, 'data': result })

        const users = await user_model.find({ _id: { $in: userIds } }).select(baseUserKeys)

        for (const item of result) {
            for (const user of users) {
                if (item.user_id == user.id) {
                    item._doc.user = user
                    break
                }
            }
        }

        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        next(e)
    }
})


export default router