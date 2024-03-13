import express from 'express'
import { verifyToken } from '../../helper.js'
import report_model from '../../models/report_model.js'

const router = express.Router()

router.post('/', verifyToken, async (req, res, next) => {

    try {


        req.body.reporter_id = req.user.id

        const object = new report_model(req.body)

        await object.save()

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

export default router