import express from 'express'
import dynamic_prop_model from '../models/dynamic_prop_model.js'
import dynamic_ad_model from '../models/dynamic_ad_model.js'
import sub_category_model from '../models/sub_category_model.js'
import favorite_model from '../models/favorite_model.js'
import user_model from '../models/user_model.js'
import auth_model from '../models/auth_model.js'
import restaurant_model from '../models/restaurant_model.js'
import food_order_model from '../models/food_order_model.js'
import loading_model from '../models/loading_model.js'
import doctor_model from '../models/doctor_model.js'
import rider_model from '../models/rider_model.js'
import rating_model from '../models/rating_model.js'
import notification_model from '../models/notification_model.js'
import mongoose from 'mongoose'
import { verifyToken, tryVerify, dynamicAdKeys } from '../helper.js'
import { sendNotifications } from '../controllers/notification_controller.js'
import { requestCashBack, } from '../controllers/cash_back_controller.js'
import subscription_model from '../models/subscription_model.js'
import { foodCategoryId, healthCategoryId } from '../controllers/ride_controller.js'
import main_category_model from '../models/main_category_model.js'
import patient_book_model from '../models/patient_book_model.js'

const router = express.Router()


router.get('/registration-services', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const food = await restaurant_model.findOne({ user_id: req.user.id })

        if (food && food.is_approved == true && food.is_active == true) {

            const category = await sub_category_model.findById(food.category_id)

            food._doc.total = await food_order_model.find({ restaurant_id: food.id }).count()
            category._doc.total = 0
            category._doc.is_favorite = false

            if (language == 'ar') {
                category._doc.name = category.name_ar
            } else {
                category._doc.name = category.name_en
            }

            delete category._doc.name_ar
            delete category._doc.name_en

            food._doc.category = category
        }

        const health = await doctor_model.findOne({ user_id: req.user.id })

        if (health && health.is_approved == true && health.is_active == true) {

            const category = await sub_category_model.findById(health.category_id)

            health._doc.total = 0

            category._doc.total = 0
            category._doc.is_favorite = false

            if (language == 'ar') {
                category._doc.name = category.name_ar
            } else {
                category._doc.name = category.name_en
            }

            delete category._doc.name_ar
            delete category._doc.name_en

            health._doc.category = category

        }

        const loading = await loading_model.findOne({ user_id: req.user.id })

        if (loading && loading.is_approved == true && loading.is_active == true) {

            const category = await sub_category_model.findById(loading.category_id)

            category._doc.total = 0
            category._doc.is_favorite = false

            if (language == 'ar') {
                category._doc.name = category.name_ar
            } else {
                category._doc.name = category.name_en
            }

            delete category._doc.name_ar
            delete category._doc.name_en

            loading._doc.category = category
        }

        const rider = await rider_model.findOne({ user_id: req.user.id })

        if (rider && rider.is_approved == true && rider.is_active == true) {
            const category = await sub_category_model.findById(rider.category_id)

            category._doc.total = 0
            category._doc.is_favorite = false

            if (language == 'ar') {
                category._doc.name = category.name_ar
            } else {
                category._doc.name = category.name_en
            }

            delete category._doc.name_ar
            delete category._doc.name_en

            rider._doc.category = category
        }

        res.json({
            'status': true,
            'data': {
                food: food && food.is_approved == true && food.is_active == true ? food : null,
                health: health && health.is_approved == true && health.is_active == true ? health : null,
                loading: loading && loading.is_approved == true && loading.is_active == true ? loading : null,
                rider: rider && rider.is_approved == true && rider.is_active == true ? rider : null,
                is_food_enable: food == null,
                is_health_enable: health == null,
                is_loading_enable: loading == null,
                is_rider_enable: rider == null,
            }
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/get-ratings', async (req, res, next) => {

    try {
        const { page, userId, categoryId } = req.query

        if (!userId || !categoryId) return next('Bad Request')

        const result = await rating_model.find({ user_id: userId, category_id: categoryId }).sort({ createdAt: -1 , _id: 1}).skip((((page ?? 1) - 1) * 20)).limit(20)

        var main_category_id = ''

        const userIds = []
        for (const rating of result) {
            if (!userIds.includes(rating.user_rating_id))
                userIds.push(rating.user_rating_id)
        }

        if (userIds.length > 0) {
            const users = await user_model.find({ _id: { $in: userIds } }).select('_id first_name profile_picture')
            for (const rating of result) {
                for (const user of users) {
                    if (rating.user_rating_id == user.id) {
                        rating._doc.user = user
                        break
                    }
                }
            }
        }

        if (page == 1) {
            const mainCategory = await sub_category_model.findById(categoryId).select('parent')
            if (mainCategory != null) main_category_id = mainCategory.parent
        }
        res.json({
            'status': true,
            'data': {
                'ratings': result,
                'main_category_id': main_category_id
            },
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/props/:categoryId', async (req, res, next) => {

    try {

        const { language } = req.headers

        const result = await dynamic_prop_model.find({ sub_category_id: req.params.categoryId }).sort('index')

        result.forEach(e => {
            if (language == 'ar') {
                e._doc.name = e.name_ar
            } else {
                e._doc.name = e.name_en
            }

            delete e._doc.name_ar
            delete e._doc.name_en
        })

        res.json({ 'status': true, 'data': result })
    } catch (e) {
        next(e)
    }
})

router.post('/create', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { sub_category_id, title, desc, dynamic, pictures } = req.body

        if (!sub_category_id || !title || !desc) return next('Bad Request')

        const user = await user_model.findById(req.user.id).select('_id country_code')

        if (!user) return next({ 'status': 404, 'message': 'Not Found' })

        const subCategory = await sub_category_model.findById(sub_category_id).select('_id parent')

        if (!subCategory) return next({ 'status': 404, 'message': language == 'ar' ? 'القسم غير موجود' : 'The Category is Not Exist' })

        const subscription = await subscription_model.findOne({
            user_id: req.user.id, sub_category_id: sub_category_id,
            is_premium: true,
        })

        const props = []

        var index = 0

        if (dynamic) {
            dynamic.forEach((item) => {

                if (item.attachment_index) {
                    item.value = pictures[item.attachment_index]
                    delete item.attachment_index
                }
                item.index = index
                index++
                if (item.values)
                    item.values = Array.from(item.values)

                if (item.value || item.values)
                    props.push(item)
            })

            props.sort(function (a, b) {
                return a.index - b.index;
            });
        }
        const object = new dynamic_ad_model({
            title, desc, sub_category_id, user_id: req.user.id, props,
            pictures: pictures.filter((e) => e.endsWith('.jpg')),
            main_category_id: subCategory.parent,
            is_premium: subscription != null,
            country_code: user.country_code,
        })

        await object.save()

        res.sendStatus(200)

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/get-sub-category-ads/:subCategory', tryVerify, async (req, res, next) => {

    try {

        const { page, country_code } = req.query

        const { language } = req.headers

        const { user } = req
        
        const result = await dynamic_ad_model.find({
            sub_category_id: req.params.subCategory,
            is_approved: true,
            is_active: true,
           // country_code,
        }).sort({ createdAt: -1 , _id: 1}).skip((((page ?? 1) - 1) * 20)).limit(20).select(dynamicAdKeys)

        if (!result) return res.json({
            'status': true,
            'data': [],
        })

        var favorites = []

        const usersIds = []

        result.forEach(ad => {
            if (!usersIds.includes(ad.user_id)) usersIds.push(ad.user_id)
        })

        if (user) {
            if (!usersIds.includes(user.id)) usersIds.push(user.id)

            favorites = await favorite_model.find({ user_id: user.id, type: 3, ad_id: { $in: result.map(e => e.id) } }).select('ad_id').distinct('ad_id')
        }

        const subscriptions = await subscription_model.find({ sub_category_id: req.params.subCategory, user_id: { $in: usersIds } }).distinct('user_id')

        const props = await dynamic_prop_model.find({ sub_category_id: req.params.subCategory })

        const subCategory = await sub_category_model.findById(req.params.subCategory).select('name_ar name_en')

        result.forEach(ad => {

            ad._doc.is_favorite = favorites.includes(ad.id)
            ad._doc.is_subscription = subscriptions.includes(ad.user_id) == true || (user && subscriptions.includes(user.id)) == true
            ad._doc.sub_category_name = language == 'ar' ? subCategory.name_ar : subCategory.name_en

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
            ad.props = ad.props.filter(e => e.name != null)
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

router.get('/premium/:mainCategory', verifyToken, async (req, res, next) => {

    try {

        const { page } = req.query

        const { language } = req.headers

        const user = await user_model.findById(req.user.id).select('_id country_code')

        const mainCategory = await main_category_model.findById(req.params.mainCategory).select('_id name_ar name_en')

        if (!user || !mainCategory) return next('Bad Request')

        var result = []

        if (req.params.mainCategory == foodCategoryId) {


            result = await restaurant_model.find({ country_code: user.country_code, is_premium: true, is_active: true, is_approved: true })
                .sort({ createdAt: -1 , _id: 1}).skip((((page ?? 1) - 1) * 20)).limit(20)


            const subCategoryIds = []

            const restaurantIds = []

            result.forEach(ad => {
                if (!subCategoryIds.includes(ad.category_id)) subCategoryIds.push(ad.category_id)
                if (!restaurantIds.includes(ad.user_id)) restaurantIds.push(ad.user_id)
            })

            const subCategories = await sub_category_model.find({ _id: { $in: subCategoryIds } }).select('name_ar name_en')

            const totalOrders = await food_order_model.aggregate([
                {
                    $match: {
                        'restaurant_id': { $in: restaurantIds },
                    }
                },
                { $group: { _id: '$restaurant_id', total: { $sum: 1 } }, },
            ])

            const now = new Date()

            result.forEach(item => {

                item._doc.is_opened = item.available_day.includes(now.getDay()) && now.getHours() >= item.work_from && now.getHours() <= item.work_to
                item._doc.is_subscription = true
                item._doc.total = 0
                item._doc.main_category_name = language == 'ar' ? mainCategory.name_ar : mainCategory.name_en

                for (const subCategory of subCategories) {
                    if (subCategory.id == item.category_id) {
                        item._doc.sub_category_name = language == 'ar' ? subCategory.name_ar : subCategory.name_en
                    }
                }

                for (const total of totalOrders) {
                    if (total._id == item.user_id) {
                        item._doc.total = total.total
                        break
                    }
                }
            })
        }

        else if (req.params.mainCategory == healthCategoryId) {


            result = await doctor_model.find({ country_code: user.country_code, is_premium: true, is_active: true, is_approved: true })
                .sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20)

            const subCategoryIds = []

            const usersIds = [req.user.id]

            result.forEach(ad => {
                if (!usersIds.includes(ad.user_id)) usersIds.push(ad.user_id)
                if (!subCategoryIds.includes(ad.category_id)) subCategoryIds.push(ad.category_id)
            })

            const subCategories = await sub_category_model.find({ _id: { $in: subCategoryIds } }).select('name_ar name_en')

            const doctorsData = await user_model.find({ _id: { $in: usersIds } }).select('_id first_name last_name')

            const totalBook = await patient_book_model.aggregate([
                {
                    $match: {
                        'doctor_id': { $in: usersIds },
                    }
                },
                { $group: { _id: '$doctor_id', total: { $sum: 1 } }, },
            ])

            const now = new Date()

            result.forEach(item => {
                item._doc.is_opened = item.available_day.includes(now.getDay()) && now.getHours() >= item.work_from && now.getHours() <= item.work_to
                item._doc.is_subscription = true

                item._doc.main_category_name = language == 'ar' ? mainCategory.name_ar : mainCategory.name_en

                for (const subCategory of subCategories) {
                    if (subCategory.id == item.category_id) {
                        item._doc.sub_category_name = language == 'ar' ? subCategory.name_ar : subCategory.name_en
                    }
                }

                item._doc.name = ''

                for (const doctor of doctorsData) {
                    if (doctor.id == item.user_id) {
                        item._doc.name = `${doctor.first_name} ${doctor.last_name}`
                        break
                    }
                }

                item._doc.total = 0
                for (const total of totalBook) {
                    if (total._id == item.user_id) {
                        item._doc.total = total.total
                        break
                    }
                }
            })

        } else {

            result = await dynamic_ad_model.find({
                main_category_id: req.params.mainCategory,
                is_approved: true,
                is_active: true,
                is_premium: true,
                country_code: user.country_code,
            }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20)
                .select(dynamicAdKeys)

            const subCategoriesIds = []

            result.forEach(e => {
                if (!subCategoriesIds.includes(e.sub_category_id)) subCategoriesIds.push(e.sub_category_id)
            })

            const subCategories = await sub_category_model.find({ _id: { $in: subCategoriesIds } }).select('_id name_ar name_en parent')

            var favorites = []

            favorites = await favorite_model.find({ user_id: user.id, type: 3, ad_id: { $in: result.map(e => e.id) } }).select('ad_id').distinct('ad_id')


            if (!result) return res.json({
                'status': true,
                'data': [],
            })

            const props = await dynamic_prop_model.find({ sub_category_id: { $in: subCategoriesIds } })

            result.forEach(ad => {

                ad._doc.is_favorite = favorites.includes(ad.id)
                ad._doc.is_subscription = true

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
                ad.props = ad.props.filter(e => e.name)
            })
        }
        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/my-ads', verifyToken, async (req, res, next) => {

    try {

        const { page } = req.query

        const { language } = req.headers

        const result = await dynamic_ad_model.find({
            user_id: req.user.id,
            is_approved: true,
            is_active: true,
        }).sort({ createdAt: -1 }).skip((((page ?? 1) - 1) * 20)).limit(20)
            .select(dynamicAdKeys)

        const subCategoriesIds = []

        result.forEach(e => {
            if (!subCategoriesIds.includes(e.sub_category_id)) subCategoriesIds.push(e.sub_category_id)
        })

        const subCategories = await sub_category_model.find({ _id: { $in: subCategoriesIds } }).select('_id name_ar name_en parent')

        if (!result) return res.json({
            'status': true,
            'data': [],
        })

        const props = await dynamic_prop_model.find({ sub_category_id: { $in: subCategoriesIds } })

        result.forEach(ad => {

            ad._doc.is_favorite = false
            ad._doc.is_subscription = false

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
            ad.props = ad.props.filter(e => e.name)
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

router.post('/add-view', verifyToken, async (req, res, next) => {
    try {

        const { id } = req.body

        if (!id) return next('Bad Request')

        dynamic_ad_model.updateOne(
            { _id: id },
            { $addToSet: { views: req.user.id } },
        ).exec()

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-views/:id', async (req, res, next) => {
    try {

        /*const result = await dynamic_ad_model.aggregate([
            {
                $match: {
                    '_id': mongoose.Types.ObjectId(req.params.id),
                }
            },
            {
                $project: {
                    item: 1,
                    views: { $cond: { if: { $isArray: "$views" }, then: { $size: "$views" }, else: 0 } }
                }
            },
        ])*/

        const result = await dynamic_ad_model.aggregate([{ $match: { _id: mongoose.Types.ObjectId(req.params.id) } }, { $project: { views: { $size: '$views' } } }])


        res.json({
            'status': true,
            'data': result ? result[0].views : 0,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-single-ad/:adId', tryVerify, async (req, res, next) => {

    try {
        const { language } = req.headers

        const ad = await dynamic_ad_model.findOne({ _id: req.params.adId, is_active: true, is_approved: true }).select(dynamicAdKeys)

        if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'الاعلان غير موجود' : 'The Ad is Not Exist' })

        const subCategory = await sub_category_model.findById(ad.sub_category_id).select('_id name_ar name_en parent')

        const props = await dynamic_prop_model.find({ sub_category_id: subCategory.id })

        const userIds = [ad.user_id]

        if (req.user) {
            userIds.push(req.user.id)
        }

        ad._doc.is_favorite = (await favorite_model.findOne({ _id: ad.id, type: 3 })) != null
        ad._doc.is_subscription = (await await subscription_model.findOne({ sub_category_id: subCategory.id, user_id: { $in: userIds } })) != null

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

        res.json({
            'status': true,
            'data': ad,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/request', verifyToken, async (req, res, next) => {
    try {

        const { language } = req.headers

        const { ad_id } = req.body

        if (!ad_id) return next('Bad Request')

        const result = await dynamic_ad_model.findOne({ _id: ad_id, is_active: true, is_approved: true, requests: { $nin: [req.user.id] } }).select(dynamicAdKeys)

        if (result && result.user_id != req.user.id) {

            dynamic_ad_model.updateOne(
                { _id: ad_id },
                { $addToSet: { requests: req.user.id } },
            ).exec()

            requestCashBack(req.user.id, language)

            const adOwnerUser = await user_model.findById(result.user_id).select('language')
            const adOwnerFcm = await auth_model.find({ user_id: result.user_id }).select('fcm').distinct('fcm')

            const titleAr = 'طلب جديد'
            const titleEn = 'New Request'

            const bodyAr = 'شخص ما يريد التواصل معك بخصوص اعلانك,  يرجى الاشترك للتواصل معه'
            const bodyEn = 'Someone wants to contact you about your ad, please subscribe to get in touch with him'

            const notifcationObject = new notification_model({
                text_ar: bodyAr,
                text_en: bodyEn,
                receiver_id: result.user_id,
                tab: 2,
                user_id: req.user.id,
                type: 10000,
                direction: ad_id,
                attachment: result.pictures[0],
                sub_category_id: result.sub_category_id,
                is_accepted: true,
            })
            notifcationObject.save()

            if (adOwnerUser && adOwnerFcm) {

                sendNotifications(
                    adOwnerFcm,
                    adOwnerUser.language == 'ar' ? titleAr : titleEn,
                    adOwnerUser.language == 'ar' ? bodyAr : bodyEn,
                )
            }
        }
        res.json({
            'status': result != null,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.delete('/delete/:id', verifyToken, async (req, res, next) => {

    try {
        const { language } = req.headers

        const ad = await dynamic_ad_model.findOneAndDelete({ _id: req.params.id, user_id: req.user.id })

        if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'الاعلان غير موجود' : 'The Ad is Not Exist' })

        res.json({
            'status': ad != null,
        })

    } catch (e) {
        next(e)
    }
})

export default router