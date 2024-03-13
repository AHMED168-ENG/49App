import express from 'express'
import { tryVerify } from '../helper.js'
import favorite_model from '../models/favorite_model.js'
import main_category_model from '../models/main_category_model.js'
import sub_category_model from '../models/sub_category_model.js'
import dynamic_ad_model from '../models/dynamic_ad_model.js'
import rider_model from '../models/rider_model.js'
import loading_model from '../models/loading_model.js'
import { comeWithYouCategoryId, foodCategoryId, taxiCategoryId, healthCategoryId, captainCategoryId, loadingCategoryId, pickMeCategoryId, rideCategoryId, womenOnlyCategoryId, scooterCategoryId } from '../controllers/ride_controller.js'
import restaurant_model from '../models/restaurant_model.js'
import doctor_model from '../models/doctor_model.js'
import come_with_me_ride_model from '../models/come_with_me_ride_model.js'
import pick_me_ride_model from '../models/pick_me_ride_model.js'

const router = express.Router()

router.get('/main', tryVerify, async (req, res, next) => {

    try {

        const { user } = req

        const { language } = req.headers

        const result = await main_category_model.find({ is_hidden: false }).sort('index')

        const ids = result.map(e => e.id)

        var favorites = []

        if (user) {
            favorites = await favorite_model.find({ user_id: user.id, type: 1, ad_id: { $in: ids } }).select('ad_id').distinct('ad_id')
        }

        const totals = await Promise.all([
            rider_model.find({}).count().exec(),
            loading_model.find({}).count().exec(),
            restaurant_model.find({}).count().exec(),
            doctor_model.find({}).count().exec(),
            dynamic_ad_model.aggregate([
                { $group: { _id: '$main_category_id', total: { $sum: 1 } }, },
            ]).exec(),
            come_with_me_ride_model.find({}).count().exec(),
            pick_me_ride_model.find({}).count().exec(),
        ])

        for (var e of result) {
            e._doc.is_favorite = favorites.includes(e.id)
            e._doc.total = 0

            if (e.id == rideCategoryId) {
                e._doc.total = totals[0] + totals[5] + totals[6]
            } else if (e.id == loadingCategoryId) {
                e._doc.total = totals[1]

            } else if (e.id == foodCategoryId) {
                e._doc.total = totals[2]
            }
            else if (e.id == healthCategoryId) {
                e._doc.total = totals[3]
            }
            else {
                for (var count of totals[4]) {
                    if (e.id == count._id) {
                        e._doc.total = count.total
                        break
                    }
                }
            }

            if (language == 'ar') {
                e._doc.name = e.name_ar
            } else {
                e._doc.name = e.name_en
            }

            delete e._doc.name_ar
            delete e._doc.name_en
        }

        res.json({
            'status': true,
            'data': result
        })
    } catch (e) {
        next(e)
    }
})

router.get('/sub/:id', tryVerify, async (req, res, next) => {

    try {
        const { language } = req.headers

        const { user } = req

        const result = await sub_category_model.find({ 'parent': req.params.id, is_hidden: false }).sort('index')

        var favorites = []

        if (user) {
            favorites = await favorite_model.find({ user_id: user.id, type: 2, ad_id: { $in: result.map(e => e.id) } }).select('ad_id').distinct('ad_id')
        }


        var counts = await (req.params.id == rideCategoryId ? rider_model.aggregate([
            { $group: { _id: '$category_id', total: { $sum: 1 } }, },

        ]) : req.params.id == loadingCategoryId ? loading_model.aggregate([
            { $group: { _id: '$category_id', total: { $sum: 1 } }, },

        ]) : req.params.id == foodCategoryId ? restaurant_model.aggregate([
            { $group: { _id: '$category_id', total: { $sum: 1 } }, },

        ]) : req.params.id == healthCategoryId ? doctor_model.aggregate([
            { $group: { _id: '$category_id', total: { $sum: 1 } }, },

        ]) : dynamic_ad_model.aggregate([
            {
                $match: { 'main_category_id': req.params.id }
            },
            { $group: { _id: '$sub_category_id', total: { $sum: 1 } }, },
        ]))

        if (req.params.id == rideCategoryId) {

            const other = await Promise.all([
                come_with_me_ride_model.find({}).count(),
                pick_me_ride_model.find({}).count(),
            ])
            counts.push({
                _id: comeWithYouCategoryId, total: other[0],
            },
                {
                    _id: pickMeCategoryId, total: other[1],
                })
        }
        result.forEach(e => {
            e._doc.is_favorite = favorites.includes(e.id)
            e._doc.total = 0

            for (var count of counts) {
                if (e.id == count._id) {
                    e._doc.total = count.total
                    break
                }
            }

            if (language == 'ar') {
                e._doc.name = e.name_ar
            } else {
                e._doc.name = e.name_en
            }

            delete e._doc.name_ar
            delete e._doc.name_en
        })

        res.json({
            'status': true,
            'data': result
        })
    } catch (e) {
        next(e)
    }
})

router.get('/sub-by-id/:id', tryVerify, async (req, res, next) => {

    try {
        const { language } = req.headers

        const result = await sub_category_model.findById(req.params.id)

        if (!result) return res.sendStatus(404)

        result._doc.name = language == 'ar' ? result._doc.name_ar : result._doc.name_en
        result._doc.total = await dynamic_ad_model.find({ sub_category_id: req.params.id }).count()
        result._doc.is_favorite = false

        if (req.user) {
            result._doc.is_favorite = (await favorite_model.findOne({ ad_id: req.params.id }).select('ad_id').distinct('ad_id')) != null
        }
        res.json({
            'status': true,
            'data': result
        })
    } catch (e) {
        next(e)
    }
})

router.get('/types', async (req, res, next) => {



    res.json({
        'status': true,
        'data': [],
    })

})
export default router