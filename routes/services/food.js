import express from 'express'

import user_model from '../../models/user_model.js'
import sub_category_model from '../../models/sub_category_model.js'
import notification_model from '../../models/notification_model.js'
import auth_model from '../../models/auth_model.js'
import restaurant_model from '../../models/restaurant_model.js'
import rating_model from '../../models/rating_model.js'
import food_model from '../../models/food_model.js'
import main_category_model from '../../models/main_category_model.js'
import subscription_model from '../../models/subscription_model.js'
import food_order_model from '../../models/food_order_model.js'

import { verifyToken } from '../../helper.js'
import { requestCashBack } from '../../controllers/cash_back_controller.js'
import { foodCategoryId } from '../../controllers/ride_controller.js'
import { sendNotifications } from '../../controllers/notification_controller.js'


const router = express.Router()

router.post('/register', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { category_id, name, location, work_from, work_to, available_day, pictures } = req.body

        const user = await user_model.findById(req.user.id).select('_id country_code')

        if (!user) return next({
            'status': 400,
            'message': language == 'ar' ? 'المستخدم غير موجود' : 'The User is Not Exist',
        })

        const result = await restaurant_model.findOne({ user_id: req.user.id })

        if (result) return next({
            'status': 400,
            'message': language == 'ar' ? 'لقد قمت بالتسجيل من قبل' : 'You already Registered Before',
        })

        const subscription = await subscription_model.findOne({
            user_id: req.user.id, sub_category_id: category_id,
            is_premium: true,
        })

        if (!location ||
            !name ||
            !work_from ||
            !work_to || !work_to || !available_day || !pictures)
            return next('Bad Request')

        const object = new restaurant_model({
            user_id: req.user.id,
            pictures,
            category_id, name, location, work_from, work_to, available_day: available_day.map(e => parseInt(e)),
            country_code: user.country_code,
            is_premium: subscription != null,
        })

        await object.save()

        user_model.updateOne({ _id: req.user.id }, { is_restaurant: true }).exec()

        res.json({
            'status': true,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.delete('/delete-registration', verifyToken, async (req, res, next) => {

    try {

        const data = await restaurant_model.findOneAndDelete({ user_id: req.user.id })

        if (data) {
            await Promise.all([
                food_model.deleteMany({ restaurant_id: req.user.id }),
                food_order_model.deleteMany({ restaurant_id: req.user.id }),
                rating_model.deleteMany({ user_id: req.user.id, category_id: data.category_id })
            ])
        }

        user_model.updateOne({ _id: req.user.id }, { is_restaurant: false }).exec()

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/foods', verifyToken, async (req, res, next) => { // for owner

    try {

        const result = await food_model.find({ restaurant_id: req.user.id, is_approved: true })

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/add-food', verifyToken, async (req, res, next) => {
    try {

        const { name, desc, price, picture } = req.body

        if (!name || !desc || !price) return next('Bad Request')

        const restaurant = await restaurant_model.findOne({ user_id: req.user.id, is_approved: true, is_active: true, }).select('_id category_id')

        if (!restaurant) return next('Bad Request')

        const object = new food_model({ restaurant_id: req.user.id, category_id: restaurant.category_id, name, desc, price, picture })

        const result = await object.save()

        return res.json({
            'status': true,
            'data': result,
        })
    } catch (e) {
        next(e)
    }
})

router.put('/update-info', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { work_from, work_to, available_day } = req.body

        const result = await restaurant_model.findOneAndUpdate({
            user_id: req.user.id, is_approved: true, is_active: true,
        }, { work_from, work_to, available_day: available_day.map(e => parseInt(e)) }, { returnOriginal: false })

        if (!result) return next({ 'status': 404, 'message': 'Not Found' })

        const category = await sub_category_model.findById(result.category_id)

        category._doc.total = 0
        category._doc.is_favorite = false

        if (language == 'ar') {
            category._doc.name = category.name_ar
        } else {
            category._doc.name = category.name_en
        }

        delete category._doc.name_ar
        delete category._doc.name_en

        result._doc.category = category

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/get-restaurant-orders', verifyToken, async (req, res, next) => {
    try {

        const { language } = req.headers

        const { page } = req.query

        const restaurant = await restaurant_model.findOne({ user_id: req.user.id }).select('_id category_id')

        if (!restaurant) return next('Bad Request')

        const result = await food_order_model.find({ restaurant_id: restaurant.id }).sort({ createdAt: -1 , _id: 1}).skip((((page ?? 1) - 1) * 20)).limit(20)

        const category = await sub_category_model.findById(restaurant.category_id).select('name_ar name_en')

        const totalOrders = await food_order_model.find({ restaurant_id: restaurant.id }).count()

        restaurant._doc.total = totalOrders

        const ratings = await rating_model.find({ category_id: category.id, ad_id: { $in: result.map(e => e.id) } })

        for (const order of result) {

            for (const rating of ratings) {
                if (order.id == rating.ad_id) {
                    order._doc.rating = rating
                    break
                }
            }

            order._doc.sub_category = language == 'ar' ? category.name_ar : category.name_en
        }

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/delete-food-item', verifyToken, async (req, res, next) => {

    try {

        const { id } = req.body

        if (!id) return next('Bad Request')

        const restaurant = await restaurant_model.findOne({ user_id: req.user.id }).select('_id')

        if (!restaurant) return next({ 'status': 404, 'message': 'Not Found' })

        const result = await food_model.findOneAndDelete({ _id: id, restaurant_id: req.user.id, })

        res.json({
            'status': result != null
        })

    } catch (e) {
        next(e)
    }
})

router.get('/restaurants/:categoryId', verifyToken, async (req, res, next) => {

    try {
        const { language } = req.headers

        const { page } = req.query

        const user = await user_model.findById(req.user.id).select('country_code')

        if (!user) return next('Bad Request')

        const subCategory = await sub_category_model.findById(req.params.categoryId).select('name_ar name_en parent')

        if (!subCategory) return next('Bad Request')

        const mainCategory = await main_category_model.findById(subCategory.parent).select('name_ar name_en')

        if (!mainCategory) return next('Bad Request')

        const result = await restaurant_model.find({ country_code: user.country_code, category_id: req.params.categoryId, is_active: true, is_approved: true })
            .sort({ createdAt: -1 , _id: 1}).skip((((page ?? 1) - 1) * 20)).limit(20)
            .select('category_id user_id pictures name location work_from work_to available_day rating is_approved is_active is_premium country_code')

        const usersIds = [req.user.id]

        result.forEach(ad => {
            if (!usersIds.includes(ad.user_id)) usersIds.push(ad.user_id)
        })

        const subscriptions = await subscription_model.find({ sub_category_id: req.params.categoryId, user_id: { $in: usersIds } }).distinct('user_id')

        const totalOrders = await food_order_model.aggregate([
            {
                $match: {
                    'restaurant_id': { $in: usersIds },
                }
            },
            { $group: { _id: '$restaurant_id', total: { $sum: 1 } }, },
        ])


        const now = new Date()

        result.forEach(item => {
            item._doc.is_opened = item.available_day.includes(now.getDay()) && now.getHours() >= item.work_from && now.getHours() <= item.work_to
            item._doc.is_subscription = subscriptions.includes(item.user_id) || subscriptions.includes(req.user.id)

            item._doc.main_category_name = language == 'ar' ? mainCategory.name_ar : mainCategory.name_en
            item._doc.sub_category_name = language == 'ar' ? subCategory.name_ar : subCategory.name_en

            item._doc.total = 0
            for (const total of totalOrders) {
                if (total._id == item.user_id) {
                    item._doc.total = total.total
                    break
                }
            }
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

router.get('/food-items/:restaurantId', verifyToken, async (req, res, next) => {

    try {

        const result = await food_model.find({ restaurant_id: req.params.restaurantId, is_approved: true })

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/make-order', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { restaurant, items } = req.body

        if (!restaurant || !items) return next('Bad Request')

        const user = await user_model.findById(req.user.id)

        if (!user) return next({ 'status': 404, 'message': 'Not Found' })

        const itemsData = await food_model.find({ restaurant_id: restaurant, _id: { $in: items } })

        if (itemsData.length == 0) return next('Bad Request')

        const restaurantData = await restaurant_model.findOne({ user_id: restaurant }).select('category_id user_id')
        const restaurantOwner = await user_model.findById(restaurantData.user_id).select('language user_id')

        if (!restaurantOwner || !restaurantData) return next({ 'status': 404, 'message': 'Not Found' })


        const order = new food_order_model({
            'category_id': restaurantData.category_id,
            'restaurant_id': restaurantData.user_id,
            'user_id': req.user.id,
            'items': itemsData.map(e => e.name)
        })

        order.save()

        const titleAr = 'طلب طعام جديد'
        const titleEn = 'New Food Request'
        const bodyEn = `New Food Request Order , Deatils ( ${itemsData.map(e => `${e.name}\n`)} )`
        const bodyAr = `طلب طعام جديد , التفاصيل ( ${itemsData.map(e => `${e.name}\n`)} )`

        restaurant_model.findOne({ user_id: restaurant, requests: { $nin: [req.user.id] } }).then(r => {
            if (r) {
                restaurant_model.updateOne({ user_id: restaurant }, { $addToSet: { requests: req.user.id } }).exec()
                requestCashBack(req.user.id, language)
            }
        })

        const notificationObject = new notification_model({
            receiver_id: restaurantData.user_id,
            user_id: req.user.id,
            sub_category_id: itemsData[0].category_id,
            tab: 2,
            text_ar: bodyAr,
            text_en: bodyEn,
            direction: restaurantData.user_id,
            main_category_id: foodCategoryId,
            type: 10007,
            ad_owner: restaurantData.user_id,
            is_accepted: true,
        })

        notificationObject.save()

        auth_model.find({ 'user_id': restaurantData.user_id }).distinct('fcm').then(fcm => {


            sendNotifications(fcm, restaurantOwner.language == 'ar' ? titleAr : titleEn, restaurantOwner.language == 'ar' ? bodyAr : bodyEn, 10007)
        })

        res.json({
            'status': true,
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/get-user-orders', verifyToken, async (req, res, next) => {
    try {

        const { language } = req.headers

        const { page } = req.query

        const result = await food_order_model.find({ user_id: req.user.id }).sort({ createdAt: -1 , _id: 1}).skip((((page ?? 1) - 1) * 20)).limit(20)

        const subCategoriesIds = []
        const restaurantsIds = []

        for (const order of result) {
            if (!subCategoriesIds.includes(order.category_id))
                subCategoriesIds.push(order.category_id)
            if (!restaurantsIds.includes(order.restaurant_id))
                restaurantsIds.push(order.restaurant_id)
        }
        const categories = await sub_category_model.find({ _id: { $in: subCategoriesIds } }).select('_id name_ar name_en')
        const restaurants = await restaurant_model.find({ _id: { $in: restaurantsIds } })

        const ratings = await rating_model.find({ user_rating_id: req.user.id, ad_id: { $in: result.map(e => e.id) } })

        const totalOrders = await food_order_model.aggregate([
            {
                $match: {
                    'restaurant_id': { $in: result.map(e => e.restaurant_id) },
                }
            },
            { $group: { _id: '$restaurant_id', total: { $sum: 1 } }, },
        ])

        for (const order of result) {

            for (const rating of ratings) {
                if (order.id == rating.ad_id) {
                    order._doc.rating = rating
                    break
                }
            }
            for (const category of categories) {
                if (order.category_id == category.id) {
                    order._doc.sub_category = language == 'ar' ? category.name_ar : category.name_en
                    break
                }
            }
            for (const restaurant of restaurants) {
                if (order.restaurant_id == restaurant.id) {
                    order._doc.restaurant_info = restaurant
                    order._doc.restaurant_info._doc.total = 0
                    for (const total of totalOrders) {
                        if (total._id == restaurant.id) {
                            order._doc.restaurant_info._doc.total = total.total
                            break
                        }
                    }
                    break
                }
            }
        }

        res.json({
            'status': true,
            'data': result,
        })
    } catch (e) {
        next(e)
    }
})

router.delete('/delete-rating', verifyToken, async (req, res, next) => {

    try {

        const { category_id, ad_id } = req.body
        const { language } = req.headers

        if (!category_id || !ad_id) return next('Bad Request')

        const result = await rating_model.findOneAndDelete({ user_rating_id: req.user.id, category_id, ad_id })

        if (!result) return next({ 'status': 400, 'message': language == 'ar' ? 'لا يوجد تقييم لهذا الاعلان' : 'No Rating for this Ad' })

        if (result) {
            if (result.length > 0) {
                const total = (result[0].field_one + result[0].field_two + result[0].field_three) / (3 * result[0].count)
                restaurant_model.updateOne({ user_id: result.user_id }, { rating: parseFloat(total).toFixed(2) }).exec()
            }
            else restaurant_model.updateOne({ user_id: result.user_id }, { rating: 5.0 }).exec()
        }



        res.json({ 'status': true })

    } catch (e) {
        next(e)
    }
})

router.post('/rating-order', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { field_one, field_two, field_three, comment, category_id, ad_id, user_id } = req.body

        if (!category_id || !ad_id || !user_id) return next('Bad Request')

        const category = await sub_category_model.findById(category_id).select('_id parent')

        if (category && category.parent == foodCategoryId) {

            if (comment.length > 100) return next({ 'stauts': 400, 'message': language == 'ar' ? 'أقصى عدد حروف للتعليق 100 حرف' : 'Max Comment length is 100 Letters' })

            await rating_model.updateOne({ user_rating_id: req.user.id, category_id, ad_id, user_id }, { field_one, field_two, field_three, comment, }, { upsert: true, new: true, setDefaultsOnInsert: true })

            var result = await rating_model.aggregate(
                [
                    { $match: { user_id, category_id } },
                    {
                        $group:
                        {
                            _id: null,
                            field_one: { $sum: "$field_one" },
                            field_two: { $sum: "$field_two" },
                            field_three: { $sum: "$field_three" },
                            count: { $sum: 1 }
                        }
                    }
                ]
            )
            if (result && result.length > 0) {
                const total = (result[0].field_one + result[0].field_two + result[0].field_three) / (3 * result[0].count)
                restaurant_model.updateOne({ user_id }, { rating: parseFloat(total).toFixed(2) }).exec()
            }

            else restaurant_model.updateOne({ user_id }, { rating: 5.0 }).exec()

            res.json({ 'status': true })

        } else return next('Bad Request')

    } catch (e) {
        next(e)
    }
})

router.get('/get-restaurant/:id', verifyToken, async (req, res, next) => {


    try {

        const { language } = req.headers

        const result = await restaurant_model.findById(req.params.id).select('category_id user_id pictures name location work_from work_to available_day rating is_approved is_active is_premium country_code')

        if (!result) return next({ 'status': 404, 'message': language == 'ar' ? 'المطعم غير موجود' : 'The Restaurant is Not Exist' })


        const subCategory = await sub_category_model.findById(result.category_id).select('name_ar name_en parent')

        if (!subCategory) return next('Bad Request')

        const mainCategory = await main_category_model.findById(subCategory.parent).select('name_ar name_en')

        if (!mainCategory) return next('Bad Request')

        const subscriptions = await subscription_model.find({ sub_category_id: req.params.categoryId, user_id: { $in: [req.user.id, result.user_id] } }).distinct('user_id')

        const totalOrders = await food_order_model.aggregate([
            {
                $match: { 'restaurant_id': result.user_id }
            },
            { $group: { _id: '$restaurant_id', total: { $sum: 1 } }, },
        ])

        const now = new Date()

        result._doc.is_opened = result.available_day.includes(now.getDay()) && now.getHours() >= result.work_from && now.getHours() <= result.work_to
        result._doc.is_subscription = subscriptions.includes(result.user_id) || subscriptions.includes(req.user.id)

        result._doc.main_category_name = language == 'ar' ? mainCategory.name_ar : mainCategory.name_en
        result._doc.sub_category_name = language == 'ar' ? subCategory.name_ar : subCategory.name_en


        result._doc.total = 0

        if (totalOrders.length > 0) {
            result._doc.total = totalOrders[0].total
        }
        
        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) { next(e) }
})

export default router