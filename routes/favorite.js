import express from 'express'
import favorite_model from '../models/favorite_model.js'
import main_category_model from '../models/main_category_model.js'
import sub_category_model from '../models/sub_category_model.js'
import dynamic_ad_model from '../models/dynamic_ad_model.js'
import dynamic_prop_model from '../models/dynamic_prop_model.js'
import rider_model from '../models/rider_model.js'
import loading_model from '../models/loading_model.js'

import subscription_model from '../models/subscription_model.js'
import { verifyToken, dynamicAdKeys } from '../helper.js'
import { comeWithYouCategoryId, foodCategoryId, healthCategoryId, loadingCategoryId, pickMeCategoryId, rideCategoryId } from '../controllers/ride_controller.js'
import restaurant_model from '../models/restaurant_model.js'
import doctor_model from '../models/doctor_model.js'
import come_with_me_ride_model from '../models/come_with_me_ride_model.js'
import pick_me_ride_model from '../models/pick_me_ride_model.js'

const router = express.Router()

router.get('/main', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const favorites = await favorite_model.find({
            user_id: req.user.id,
            type: 1,
        }).sort({ createdAt: -1 , _id: 1}).select('ad_id').distinct('ad_id')

        const result = await main_category_model.find({ _id: { $in: favorites.map(e => e) }, is_hidden: false })

        const counts = await dynamic_ad_model.aggregate([
            { $group: { _id: '$main_category_id', total: { $sum: 1 } }, },
        ])

        for (const e of result) {
            e._doc.is_favorite = true
            e._doc.total = 0

            if (e.id == rideCategoryId) {
                const data = await Promise.all([
                    rider_model.find({}).count(),
                    come_with_me_ride_model.find({}).count(),
                    pick_me_ride_model.find({}).count(),
                ])

                e._doc.total = data[0] + data[1] + data[2]

            } else if (e.id == loadingCategoryId) {
                e._doc.total = await loading_model.find({}).count()
            }
            else if (e.id == foodCategoryId) {
                e._doc.total = await restaurant_model.find({}).count()
            }
            else if (e.id == healthCategoryId) {
                e._doc.total = await doctor_model.find({}).count()
            }
            else {
                for (var count of counts) {
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
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/main', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { id } = req.body

        if (!id) return next('Bad Request')

        const mainCategory = await main_category_model.findById(id)

        if (!mainCategory) return next({ 'status': 404, 'message': language == 'ar' ? 'القسم غير موجود' : 'The Category is Not Exist' })

        await favorite_model.updateOne({ user_id: req.user.id, ad_id: id, type: 1 }, { user_id: req.user.id, ad_id: id, type: 1 }, { upsert: true, new: true, setDefaultsOnInsert: true })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/main/:id', verifyToken, async (req, res, next) => {

    try {

        await favorite_model.deleteOne({ user_id: req.user.id, ad_id: req.params.id, type: 1 })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/sub', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const favorites = await favorite_model.find({
            user_id: req.user.id,
            type: 2,
        }).sort({ createdAt: -1 , _id: 1}).skip((((page ?? 1) - 1) * 20)).limit(20).select('ad_id')


        const result = await sub_category_model.find({ _id: { $in: favorites.map(e => e.ad_id) }, is_hidden: false })

        const subCategories = []
        const promise = []

        var isRideAdded = false
        var isComeWithMeAdded = false
        var isPickMeAdded = false

        var isLoadingAdded = false
        var isFoodAdded = false
        var isHealthAdded = false

        for (const favorite of result) {
            if (!subCategories.includes(favorite.id))
                subCategories.push(favorite.id)

            if (favorite.parent == rideCategoryId && favorite.id != comeWithYouCategoryId && favorite.id != pickMeCategoryId && isRideAdded == false) {
                isRideAdded = true
                promise.push(rider_model.aggregate([
                    { $group: { _id: '$category_id', total: { $sum: 1 } }, },

                ]))
            }
            if (favorite.id == comeWithYouCategoryId && isComeWithMeAdded == false) {
                isComeWithMeAdded = true
                promise.push(come_with_me_ride_model.aggregate([
                    { $group: { _id: comeWithYouCategoryId, total: { $sum: 1 } }, },

                ]))
            }
            if (favorite.id == pickMeCategoryId && isPickMeAdded == false) {
                isPickMeAdded = true
                promise.push(pick_me_ride_model.aggregate([
                    { $group: { _id: pickMeCategoryId, total: { $sum: 1 } }, },

                ]))
            }
            if (favorite.parent == loadingCategoryId && isLoadingAdded == false) {
                isLoadingAdded = true
                promise.push(loading_model.aggregate([
                    { $group: { _id: '$category_id', total: { $sum: 1 } }, },

                ]))
            }
            if (favorite.parent == foodCategoryId && isFoodAdded == false) {
                isFoodAdded = true
                promise.push(restaurant_model.aggregate([
                    { $group: { _id: '$category_id', total: { $sum: 1 } }, },

                ]))
            }
            if (favorite.parent == healthCategoryId && isHealthAdded == false) {
                isHealthAdded = true
                promise.push(doctor_model.aggregate([
                    { $group: { _id: '$category_id', total: { $sum: 1 } }, },

                ]))
            }
        }

        if (subCategories.length > 0)
            promise.push(dynamic_ad_model.aggregate([
                { $group: { _id: '$sub_category_id', total: { $sum: 1 } }, },

            ]))

        const allCounts = await Promise.all(promise)

        const counts = []

        for (const item of allCounts) {
            for (const singleItem of item) {
                counts.push(singleItem)
            }
        }
        result.forEach(e => {
            e._doc.is_favorite = true
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
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/sub', verifyToken, async (req, res, next) => {

    try {
        const { language } = req.headers

        const { id } = req.body

        if (!id) return next('Bad Request')

        const subCategory = await sub_category_model.findById(id)

        if (!subCategory) return next({ 'status': 404, 'message': language == 'ar' ? 'القسم غير موجود' : 'The Category is Not Exist' })

        await favorite_model.updateOne({ user_id: req.user.id, ad_id: id, type: 2 }, { user_id: req.user.id, ad_id: id, type: 2 }, { upsert: true, new: true, setDefaultsOnInsert: true })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/sub/:id', verifyToken, async (req, res, next) => {

    try {

        await favorite_model.deleteOne({ user_id: req.user.id, ad_id: req.params.id, type: 2 })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/ad', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const favorites = await favorite_model.find({
            user_id: req.user.id,
            type: 3,
        }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20).select('ad_id sub_category_id')


        const ads = await dynamic_ad_model.find({ _id: { $in: favorites.map(e => e.ad_id) }, is_active: true, is_approved: true }).select(dynamicAdKeys)

        const subCategoriesIds = []
        const usersIds = [req.user.id]

        ads.forEach(e => {
            if (!usersIds.includes(e.user_id)) usersIds.push(e.user_id)
        })

        favorites.forEach(e => {

            if (!subCategoriesIds.includes(e.sub_category_id)) subCategoriesIds.push(e.sub_category_id)
        })

        const subCategories = await sub_category_model.find({ _id: { $in: subCategoriesIds } }).select('_id name_ar name_en parent')

        const props = await dynamic_prop_model.find({ sub_category_id: { $in: subCategoriesIds } })

        const subscriptions = await subscription_model.find({ sub_category_id: { $in: subCategoriesIds }, user_id: { $in: usersIds } }).select('sub_category_id user_id')


        ads.forEach(ad => {

            ad._doc.is_favorite = true
            ad._doc.is_subscription = false

            for (const subscription of subscriptions) {
                if (subscription.sub_category_id == ad.sub_category_id && (ad.user_id == subscription.user_id || subscription.user_id == req.user.id)) {
                    ad._doc.is_subscription = true
                    break
                }
            }

            for (const subCategory of subCategories) {
                if (ad.sub_category_id == subCategory.id) {
                    ad._doc.sub_category_name = language == 'ar' ? subCategory.name_ar : subCategory.name_en
                    ad._doc.sub_category_parent = subCategory.parent
                    break
                }
            }

            ad.props.forEach(adProp => {
                for (const prop of props) {
                    if (prop.id == adProp.id) {
                        adProp._id = adProp.id
                        adProp.name = language == 'ar' ? prop.name_ar : prop.name_en
                        adProp.selections = prop.selections
                        delete adProp.id
                        break
                    }
                }
            })
        })
        res.json({
            'status': true,
            'data': ads,
        })

    } catch (e) {

        next(e)
    }
})

router.post('/ad', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { id } = req.body

        if (!id) return next('Bad Request')

        const ad = await dynamic_ad_model.findById(id)

        if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'الاعلان غير موجود' : 'The Ad is Not Exist' })

        await favorite_model.updateOne({ user_id: req.user.id, ad_id: id, type: 3, sub_category_id: ad.sub_category_id }, { user_id: req.user.id, ad_id: id, type: 3, sub_category_id: ad.sub_category_id }, { upsert: true, new: true, setDefaultsOnInsert: true })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/ad/:id', verifyToken, async (req, res, next) => {

    try {

        await favorite_model.deleteOne({ user_id: req.user.id, ad_id: req.params.id, type: 3 })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})
export default router