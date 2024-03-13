import express from 'express'
import { verifyToken } from '../../helper.js'
import user_model from '../../models/user_model.js'
import sub_category_model from '../../models/sub_category_model.js'
import notification_model from '../../models/notification_model.js'
import auth_model from '../../models/auth_model.js'
import rating_model from '../../models/rating_model.js';

import { healthCategoryId } from '../../controllers/ride_controller.js';
import { sendNotifications } from '../../controllers/notification_controller.js';
import main_category_model from '../../models/main_category_model.js';
import subscription_model from '../../models/subscription_model.js';
import doctor_model from '../../models/doctor_model.js';
import patient_book_model from '../../models/patient_book_model.js';
import { requestCashBack } from '../../controllers/cash_back_controller.js';

const router = express.Router()

router.post('/register', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { category_id, specialty, location, work_from, work_to, available_day, examination_price, waiting_time, pictures } = req.body

        const picture = pictures[0]

        const id_front = pictures[1]
        const id_behind = pictures[2]

        const practice_license_front = pictures[3]
        const practice_license_behind = pictures[4]

        const user = await user_model.findById(req.user.id).select('_id country_code')

        if (!user) return next({
            'status': 400,
            'message': language == 'ar' ? 'المستخدم غير موجود' : 'The User is Not Exist',
        })

        const result = await doctor_model.findOne({ user_id: req.user.id })

        if (result) return next({
            'status': 400,
            'message': language == 'ar' ? 'لقد قمت بالتسجيل من قبل' : 'You already Registered Before',
        })

        if (!location ||
            !specialty ||
            !available_day)
            return next('Bad Request')

        const subscription = await subscription_model.findOne({
            user_id: req.user.id, sub_category_id: category_id,
            is_premium: true,
        })

        const object = new doctor_model({
            user_id: req.user.id,
            picture,
            id_front,
            id_behind,
            practice_license_front,
            practice_license_behind,
            category_id, location, work_from, work_to, available_day: available_day.map(e => parseInt(e)),
            country_code: user.country_code,
            examination_price, waiting_time,
            specialty,
            is_premium: subscription != null,
        })

        await object.save()

        user_model.updateOne({ _id: req.user.id }, { is_doctor: true }).exec()

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

        const data = await doctor_model.findOneAndDelete({ user_id: req.user.id })

        if (data) {
            await Promise.all([
                patient_book_model.deleteMany({ doctor_id: req.user.id }),
                rating_model.deleteMany({ user_id: req.user.id, category_id: data.category_id }),
                user_model.updateOne({ _id: req.user.id }, { is_doctor: false })
            ])
        }
        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.put('/update-info', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { work_from, work_to, available_day, waiting_time, examination_price } = req.body

        const result = await doctor_model.findOneAndUpdate({
            user_id: req.user.id, is_approved: true, is_active: true,
        }, { work_from, work_to, available_day: available_day.map(e => parseInt(e)), waiting_time, examination_price }, { returnOriginal: false })

        if (!result) return next({ 'status': 404, 'message': 'Not Found' })

        const category = await sub_category_model.findById(result.category_id)

        result._doc.total = 0

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

router.post('/update-picture', verifyToken, async (req, res, next) => {

    try {

        const { path } = req.body

        if (!path) return next('Bad Request')

        await doctor_model.updateOne({
            user_id: req.user.id, is_approved: true, is_active: true,
        }, { picture: path })

        res.json({
            'status': true,

        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-doctor-books', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const doctor = await doctor_model.findOne({ user_id: req.user.id }).select('_id category_id')

        if (!doctor) return next('Bad Request')

        const result = await patient_book_model.find({ doctor_id: req.user.id }).sort({ createdAt: -1 , _id: 1}).skip((((page ?? 1) - 1) * 20)).limit(20)

        const category = await sub_category_model.findById(doctor.category_id).select('name_ar name_en')

        const totalBooks = await patient_book_model.find({ user_id: req.user.id }).count()

        doctor._doc.total = totalBooks

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

router.get('/doctors/:categoryId', verifyToken, async (req, res, next) => {

    try {
        const { language } = req.headers

        const { page } = req.query

        const user = await user_model.findById(req.user.id).select('country_code')

        if (!user) return next('Bad Request')

        const subCategory = await sub_category_model.findById(req.params.categoryId).select('name_ar name_en parent')

        if (!subCategory) return next('Bad Request')

        const mainCategory = await main_category_model.findById(subCategory.parent).select('name_ar name_en')

        if (!mainCategory) return next('Bad Request')

        const result = await doctor_model.find({ country_code: user.country_code, category_id: req.params.categoryId, is_active: true, is_approved: true })
            .select('_id category_id category_id user_id location specialty work_from work_to available_day rating examination_price waiting_time createdAt')
            .sort({ createdAt: -1 , _id: 1}).skip((((page ?? 1) - 1) * 20)).limit(20)


        const usersIds = [req.user.id]

        result.forEach(ad => {
            if (!usersIds.includes(ad.user_id)) usersIds.push(ad.user_id)
            delete ad._doc.calls
        })

        const doctorsData = await user_model.find({ _id: { $in: usersIds } }).select('_id first_name last_name profile_picture')

        const subscriptions = await subscription_model.find({ sub_category_id: req.params.categoryId, user_id: { $in: usersIds } }).distinct('user_id')

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
            item._doc.is_subscription = subscriptions.includes(item.user_id) || subscriptions.includes(req.user.id)

            item._doc.main_category_name = language == 'ar' ? mainCategory.name_ar : mainCategory.name_en
            item._doc.sub_category_name = language == 'ar' ? subCategory.name_ar : subCategory.name_en

            item._doc.name = ''

            for (const user of doctorsData) {
                if (user.id == item.user_id) {
                    item._doc.name = `${user.first_name} ${user.last_name}`
                    item._doc.picture = user.profile_picture
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

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/book', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { id, category_id, book_time } = req.body

        if (!id || !category_id || !book_time) return next('Bad Request')

        const user = await user_model.findById(req.user.id).select('_id')

        const doctor = await doctor_model.findOne({ user_id: id, category_id, is_approved: true, is_active: true }).select('user_id')

        const doctorUser = await user_model.findOne({ user_id: doctor.user_id }).select('language')

        const subCategory = await sub_category_model.findById(category_id).select('name_ar name_en')

        if (!user || !doctor || !subCategory || !doctorUser) return next({ 'status': 404, 'message': 'Not Found' })

        const book = new patient_book_model({
            'category_id': category_id,
            'doctor_id': doctor.user_id,
            'user_id': req.user.id,
            book_time,
        })

        book.save()

        const titleAr = `حجز ${subCategory.name_ar} جديد`
        const titleEn = `New ${subCategory.name_en} Book`
        const bodyEn = `New ${subCategory.name_en} Book, Patient Book a Session in your clinic at ${book_time}`
        //const bodyAr = `يوم حجز ${subCategory.name_ar} مريض يحجز جلسة في عيادتك\n${book_time} `

        const bodyAr = `مريض يريد ان يحجز في عيادتك ${subCategory.name_ar} \n يوم ${book_time}`
        const notificationObject = new notification_model({
            receiver_id: doctor.user_id,
            user_id: req.user.id,
            sub_category_id: category_id,
            tab: 2,
            text_ar: bodyAr,
            text_en: bodyEn,
            direction: doctor.user_id,
            main_category_id: healthCategoryId,
            type: 10008,
            ad_owner: doctor.user_id,
            is_accepted: true,
        })

        notificationObject.save()

        doctor_model.findOne({ user_id: id, requests: { $nin: [req.user.id] } }).then(r => {

            if (r) {
                doctor_model.updateOne({ user_id: id }, { $addToSet: { requests: req.user.id } }).exec()
                requestCashBack(req.user.id, language)
            }
        })

        auth_model.find({ 'user_id': doctor.user_id }).distinct('fcm').then(fcm => {

            sendNotifications(fcm, doctorUser.language == 'ar' ? titleAr : titleEn, doctorUser.language == 'ar' ? bodyAr : bodyEn, 10008)
        })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-user-books', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const result = await patient_book_model.find({ user_id: req.user.id }).sort({ createdAt: -1 , _id: 1}).skip((((page ?? 1) - 1) * 20)).limit(20)

        if (result.length == 0) return res.json({ 'status': true, 'data': [] })

        const subCategoriesIds = []
        const doctorIds = []
        const doctorUserIds = []

        for (const book of result) {
            if (!subCategoriesIds.includes(book.category_id))
                subCategoriesIds.push(book.category_id)
            if (!doctorIds.includes(book.doctor_id))
                doctorIds.push(book.doctor_id)
            if (!doctorUserIds.includes(book.doctor_id))
                doctorUserIds.push(book.doctor_id)
        }

        const categories = await sub_category_model.find({ _id: { $in: subCategoriesIds } }).select('_id name_ar name_en')

        const doctors = await doctor_model.find({ user_id: { $in: doctorIds } })

        const doctorsData = await user_model.find({ _id: { $in: doctorUserIds } }).select('_id first_name last_name')

        const ratings = await rating_model.find({ user_rating_id: req.user.id, ad_id: { $in: result.map(e => e.id) } })

        const totalBooks = await patient_book_model.aggregate([
            {
                $match: {
                    'doctor_id': { $in: doctorIds },
                }
            },
            { $group: { _id: '$doctor_id', total: { $sum: 1 } }, },
        ])

        for (const book of result) {

            for (const rating of ratings) {
                if (book.id == rating.ad_id) {
                    book._doc.rating = rating
                    break
                }
            }
            for (const category of categories) {
                if (book.category_id == category.id) {
                    book._doc.sub_category = language == 'ar' ? category.name_ar : category.name_en
                    break
                }
            }
            for (const doctor of doctors) {

                if (book.doctor_id == doctor.user_id) {

                    book._doc.doctor_info = doctor
                    book._doc.doctor_info._doc.total = 0
                    for (const total of totalBooks) {
                        if (total._id == doctor.user_id) {
                            book._doc.doctor_info._doc.total = total.total
                            break
                        }
                    }
                    for (const doctorData of doctorsData) {
                        if (doctorData.id == doctor.user_id) {
                            book._doc.doctor_info._doc.name = `${doctorData.first_name} ${doctorData.last_name}`
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
                doctor_model.updateOne({ user_id: result.user_id }, { rating: parseFloat(total).toFixed(2) }).exec()
            }
            else doctor_model.updateOne({ user_id: result.user_id }, { rating: 5.0 }).exec()
        }



        res.json({ 'status': true })

    } catch (e) {
        next(e)
    }
})

router.post('/rating', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { field_one, field_two, field_three, comment, category_id, ad_id, user_id } = req.body

        if (!category_id || !ad_id || !user_id) return next('Bad Request')

        const category = await sub_category_model.findById(category_id).select('_id parent')

        if (category && category.parent == healthCategoryId) {

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
                doctor_model.updateOne({ user_id }, { rating: parseFloat(total).toFixed(2) }).exec()
            }

            else doctor_model.updateOne({ user_id }, { rating: 5.0 }).exec()

            res.json({ 'status': true })

        } else return next('Bad Request')

    } catch (e) {
        next(e)
    }
})

router.get('/get-doctor/:id', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const result = await doctor_model.findById(req.params.id).select('_id category_id category_id user_id location specialty work_from work_to available_day rating examination_price waiting_time createdAt')

        if (!result) return next({ 'status': 404, 'message': language == 'ar' ? 'المطعم غير موجود' : 'The Restaurant is Not Exist' })

        const subCategory = await sub_category_model.findById(result.category_id).select('name_ar name_en parent')

        if (!subCategory) return next('Bad Request')

        const mainCategory = await main_category_model.findById(subCategory.parent).select('name_ar name_en')

        if (!mainCategory) return next('Bad Request')

        const subscriptions = await subscription_model.find({ sub_category_id: req.params.categoryId, user_id: { $in: [req.user.id, result.user_id] } }).distinct('user_id')

        const totalBook = await patient_book_model.aggregate([
            {
                $match: {
                    'doctor_id': result.user_id,
                }
            },
            { $group: { _id: '$doctor_id', total: { $sum: 1 } }, },
        ])

        const doctorData = await user_model.findById(result.user_id).select('_id first_name last_name')

        const now = new Date()

        result._doc.is_opened = result.available_day.includes(now.getDay()) && now.getHours() >= result.work_from && now.getHours() <= result.work_to
        result._doc.is_subscription = subscriptions.includes(result.user_id) || subscriptions.includes(req.user.id)

        result._doc.main_category_name = language == 'ar' ? mainCategory.name_ar : mainCategory.name_en
        result._doc.sub_category_name = language == 'ar' ? subCategory.name_ar : subCategory.name_en

        result._doc.name = ''

        if (doctorData) {
            result._doc.name = `${doctorData.first_name} ${doctorData.last_name}`
        }

        result._doc.total = 0

        if (totalBook.length > 0) {
            result._doc.total = totalBook[0].total
        }

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) { next(e) }
})
export default router