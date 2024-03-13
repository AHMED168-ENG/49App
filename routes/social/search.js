import express from 'express'
import { comeWithYouCategoryId, foodCategoryId, healthCategoryId, loadingCategoryId, pickMeCategoryId, rideCategoryId } from '../../controllers/ride_controller.js'
import { baseUserKeys, dynamicAdKeys, tryVerify } from '../../helper.js'
import come_with_me_ride_model from '../../models/come_with_me_ride_model.js'
import doctor_model from '../../models/doctor_model.js'
import dynamic_ad_model from '../../models/dynamic_ad_model.js'
import dynamic_prop_model from '../../models/dynamic_prop_model.js'
import favorite_model from '../../models/favorite_model.js'
import loading_model from '../../models/loading_model.js'
import main_category_model from '../../models/main_category_model.js'
import pick_me_ride_model from '../../models/pick_me_ride_model.js'
import restaurant_model from '../../models/restaurant_model.js'
import rider_model from '../../models/rider_model.js'
import subscription_model from '../../models/subscription_model.js'
import sub_category_model from '../../models/sub_category_model.js'
import user_model from '../../models/user_model.js'


const router = express.Router()

router.post('/people', async (req, res, next) => {

    try {

        const { data } = req.body

        const { page } = req.query

        if (!data) return next('Bad Request')

        const searchResult = await user_model.find(
            {
                $or: [
                    {
                        first_name: { $regex: '.*' + data + '.*', $options: 'i' }, is_rider: false,
                        is_doctor: false,
                        is_restaurant: false,
                        is_loading: false,
                        is_locked: false,
                    },
                    {
                        last_name: { $regex: '.*' + data + '.*', $options: 'i' }, is_rider: false,
                        is_doctor: false,
                        is_restaurant: false,
                        is_loading: false,
                        is_locked: false,
                    }]
            }).skip((((page ?? 1) - 1) * 20)).limit(20).select('_id')

        var result = []

        if (searchResult.length > 0) {
            const ids = []

            for (const item of searchResult) {
                if (!ids.includes(item.id)) ids.push(item.id)
            }

            result = await user_model.find({ _id: { $in: ids } }).select(baseUserKeys)
        }

        res.json({ 'status': true, 'data': result })

    } catch (e) {
        next(e)
    }
})

router.post('/posts', async (req, res, next) => {

    try {

        const { data } = req.body

        const { page } = req.query

        if (!data) return next('Bad Request')

        /*const result = await user_model.find(
            {
                $or: [
                    {
                        first_name: { $regex: '.*' + data + '.*', $options: 'i' }, is_rider: false,
                        is_doctor: false,
                        is_restaurant: false,
                        is_loading: false,
                        is_locked: false,
                    },
                    {
                        last_name: { $regex: '.*' + data + '.*', $options: 'i' }, is_rider: false,
                        is_doctor: false,
                        is_restaurant: false,
                        is_loading: false,
                        is_locked: false,
                    }]
            }).skip((((page ?? 1) - 1) * 20)).limit(20).select('first_name last_name profile_picture')
        res.json({ 'status': true, 'data': result })*/

        res.json({ 'status': true, 'data': [] })
    } catch (e) {
        next(e)
    }
})

router.post('/main-category', tryVerify, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const { data } = req.body

        const { user } = req

        if (!data) return next('Bad Request')

        var result = []

        const searchResult = await main_category_model.find(
            {
                $or: [
                    {
                        name_ar: { $regex: '.*' + data + '.*', $options: 'i' },
                        is_hidden: false,
                    },
                    {
                        name_en: { $regex: '.*' + data + '.*', $options: 'i' },
                        is_hidden: false,
                    }]
            }).skip((((page ?? 1) - 1) * 20)).limit(20).select('_id')

        if (searchResult.length > 0) {

            const ids = []

            for (const item of searchResult) {
                if (!ids.includes(item.id)) ids.push(item.id)
            }

            var favorites = []

            if (user) {
                favorites = await favorite_model.find({ user_id: user.id, type: 1, ad_id: { $in: ids } }).distinct('ad_id')
            }

            result = await main_category_model.find({ _id: ids })

            const totals = await Promise.all([
                rider_model.find({}).count().exec(),
                loading_model.find({}).count().exec(),
                restaurant_model.find({}).count().exec(),
                doctor_model.find({}).count().exec(),
                dynamic_ad_model.aggregate([
                    { $group: { _id: '$main_category_id', total: { $sum: 1 } }, },
                ]).exec()
            ])

            for (var e of result) {
                e._doc.is_favorite = favorites.includes(e.id)
                e._doc.total = 0

                if (e.id == rideCategoryId) {
                    e._doc.total = totals[0]
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
        }

        res.json({ 'status': true, 'data': result })

    } catch (e) {
        next(e)
    }
})

router.post('/sub-category', tryVerify, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { data } = req.body

        const { page } = req.query

        const { user } = req

        if (!data) return next('Bad Request')


        var result = []

        const searchResult = await sub_category_model.find(
            {
                $or: [
                    {
                        name_ar: { $regex: '.*' + data + '.*', $options: 'i' },
                        is_hidden: false,
                    },
                    {
                        name_en: { $regex: '.*' + data + '.*', $options: 'i' },
                        is_hidden: false,
                    }]
            }).skip((((page ?? 1) - 1) * 20)).limit(20).select('_id')

        if (searchResult.length > 0) {

            const ids = []

            for (const item of searchResult) {
                if (!ids.includes(item.id)) ids.push(item.id)
            }

            result = await sub_category_model.find({ _id: { $in: ids } })

            var favorites = []

            if (user) {
                favorites = await favorite_model.find({ user_id: user.id, type: 2, ad_id: { $in: ids } }).select('ad_id').distinct('ad_id')
            }

            const subCategories = []
            const promise = []

            var isRideAdded = false
            var isComeWithMeAdded = false
            var isPickMeAdded = false

            var isLoadingAdded = false
            var isFoodAdded = false
            var isHealthAdded = false

            for (const category of result) {
                if (!subCategories.includes(category.id))
                    subCategories.push(category.id)

                if (category.parent == rideCategoryId && category.id != comeWithYouCategoryId && category.id != pickMeCategoryId && isRideAdded == false) {
                    isRideAdded = true
                    promise.push(rider_model.aggregate([
                        { $group: { _id: '$category_id', total: { $sum: 1 } }, },

                    ]))
                }
                if (category.id == comeWithYouCategoryId && isComeWithMeAdded == false) {
                    isComeWithMeAdded = true
                    promise.push(come_with_me_ride_model.aggregate([
                        { $group: { _id: comeWithYouCategoryId, total: { $sum: 1 } }, },

                    ]))
                }
                if (category.id == pickMeCategoryId && isPickMeAdded == false) {
                    isPickMeAdded = true
                    promise.push(pick_me_ride_model.aggregate([
                        { $group: { _id: pickMeCategoryId, total: { $sum: 1 } }, },

                    ]))
                }
                if (category.parent == loadingCategoryId && isLoadingAdded == false) {
                    isLoadingAdded = true
                    promise.push(loading_model.aggregate([
                        { $group: { _id: '$category_id', total: { $sum: 1 } }, },

                    ]))
                }
                if (category.parent == foodCategoryId && isFoodAdded == false) {
                    isFoodAdded = true
                    promise.push(restaurant_model.aggregate([
                        { $group: { _id: '$category_id', total: { $sum: 1 } }, },

                    ]))
                }
                if (category.parent == healthCategoryId && isHealthAdded == false) {
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
        }

        res.json({ 'status': true, 'data': result })

    } catch (e) {
        next(e)
    }
})

router.post('/ads', tryVerify, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { data } = req.body

        const { page } = req.query

        const { user } = req

        if (!data) return next('Bad Request')

        var result = []

        const searchResult = await dynamic_ad_model.find(
            {
                $or: [
                    {
                        title: { $regex: '.*' + data + '.*', $options: 'i' },
                        is_approved: true,
                        is_active: true,
                    },
                    {
                        desc: { $regex: '.*' + data + '.*', $options: 'i' },
                        is_approved: true,
                        is_active: true,
                    }]
            }).skip((((page ?? 1) - 1) * 20)).limit(20).select('_id')

        if (searchResult.length > 0) {

            const ids = []

            for (const item of searchResult) {
                if (!ids.includes(item.id)) ids.push(item.id)
            }

            result = await dynamic_ad_model.find({ _id: { $in: ids } }).select(dynamicAdKeys)

            var favorites = []

            const usersIds = []

            const subCategoryIds = []

            result.forEach(ad => {
                if (!usersIds.includes(ad.user_id)) usersIds.push(ad.user_id)
                if (!subCategoryIds.includes(ad.sub_category_id)) subCategoryIds.push(ad.sub_category_id)
            })

            if (user) {
                if (!usersIds.includes(user.id)) usersIds.push(user.id)

                favorites = await favorite_model.find({ user_id: user.id, type: 3, ad_id: { $in: result.map(e => e.id) } }).distinct('ad_id')
            }

            const subscriptions = await subscription_model.find({ sub_category_id: { $in: subCategoryIds }, user_id: { $in: usersIds } }).distinct('user_id')

            const props = await dynamic_prop_model.find({ sub_category_id: { $in: subCategoryIds } })

            result.forEach(ad => {

                ad._doc.is_favorite = favorites.includes(ad.id)
                ad._doc.is_subscription = subscriptions.includes(ad.user_id) || (user && subscriptions.includes(user.id))

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
        }

        res.json({ 'status': true, 'data': result })

    } catch (e) {
        next(e)
    }
})

export default router