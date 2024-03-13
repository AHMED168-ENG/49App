import express from 'express'
import rider_model from '../../models/rider_model.js';
import subscription_model from '../../models/subscription_model.js';
import app_manager_model from '../../models/app_manager_model.js';
import sub_category_model from '../../models/sub_category_model.js';
import notification_model from '../../models/notification_model.js';
import user_model from '../../models/user_model.js'
import auth_model from '../../models/auth_model.js'
import ride_model from '../../models/ride_model.js';
import rating_model from '../../models/rating_model.js';

import { verifyToken, comeWithMeTripKeys, pickMeTripKeys, tryVerify } from '../../helper.js'
import { sendNotifications } from '../../controllers/notification_controller.js'
import { comeWithYouCategoryId, scooterCategoryId, createOtherRequest, isTaxiOrCaptainOrScooter, pickMeCategoryId, rideCategoryId, womenOnlyCategoryId } from '../../controllers/ride_controller.js'
import { requestCashBack } from '../../controllers/cash_back_controller.js';
import come_with_me_ride_model from '../../models/come_with_me_ride_model.js';
import pick_me_ride_model from '../../models/pick_me_ride_model.js';
import axios from 'axios';
import wallet_model from '../../models/wallet_model.js';


const router = express.Router()


///////////////////////////////////////////////// RIDER /////////////////////////////////////////////////////////////


router.get('/attachments-info', async (req, res, next) => { // attachments info

    try {

        const info = await app_manager_model.findOne({}).select('ride_criminal_record ride_technical_examination ride_drug_analysis ride_technical_examination_center_phone ride_technical_examination_center_location ride_drug_analysis_center_phone ride_drug_analysis_center_location')

        delete info._doc._id

        res.json({
            'status': true,
            'data': info
        })
    } catch (e) {
        console.log(e)
        res.status(500).send({
            status: false,
            message: e.message ?? e,
        });
    }
})

router.post('/register-rider', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { phone, airـconditioner, car_model_year, pricing_per_km, car_brand, car_type, car_plate_letters, car_plate_numbers, category_id, pictures } = req.body

        const car_pictures = pictures.slice(0, 4)

        const id_front = pictures[4]
        const id_behind = pictures[5]

        const driving_license_front = pictures[6]
        const driving_license_behind = pictures[7]

        const car_license_front = pictures[8]
        const car_license_behind = pictures[9]

        const user = await user_model.findById(req.user.id).select('_id country_code is_male')

        if (!user) return next({
            'status': 400,
            'message': language == 'ar' ? 'المستخدم غير موجود' : 'The User is Not Exist',
        })

        if (category_id == womenOnlyCategoryId && user.is_male != false) {
            return next({
                'status': 400,
                'message': language == 'ar' ? 'ليس مسموحا لك بالتسجيل فى هذا القسم' : 'You are not authorized to register in this category',
            })
        }
        const result = await rider_model.findOne({ user_id: req.user.id })

        if (result) return next({
            'status': 400,
            'message': language == 'ar' ? 'لقد قمت بالتسجيل من قبل' : 'You already Registered Before',
        })

        if (!pricing_per_km ||
            !car_brand ||
            !car_type ||
            !car_plate_letters ||
            !car_plate_numbers ||
            !category_id)
            return next('Bad Request')

        const object = new rider_model({
            user_id: req.user.id,
            car_pictures, id_front, id_behind, driving_license_front, driving_license_behind, car_license_front,
            car_license_behind, criminal_record: pictures.length > 10 ? pictures[11] : null, technical_examination: pictures.length > 11 ? pictures[12] : null,
            drug_analysis: pictures.length > 12 ? pictures[12] : null,
            pricing_per_km, car_brand, car_type, car_plate_letters, car_plate_numbers,
            category_id,
            country_code: user.country_code,
            phone,
            airـconditioner,
            car_model_year,
        })

        await object.save()

        user_model.updateOne({ _id: req.user.id }, { is_rider: true }).exec()

        res.json({
            'status': true,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/get-high-low-price', async (req, res, next) => {

    try {

        const { distance, category } = req.body

        if (!distance || !category) return next('Bad Request')

        const high = await rider_model
            .findOne({ is_approved: true, category_id: category })
            .sort('-pricing_per_km').select('pricing_per_km')

        const low = await rider_model
            .findOne({ is_approved: true, category_id: category })
            .sort('pricing_per_km').select('pricing_per_km')


        const extraPrice = category == scooterCategoryId ? 5 : 10

        res.json({
            'status': true,
            'data': {
                'high': parseFloat((high ? high.pricing_per_km : (category == scooterCategoryId ? 2.5 : 4)) * (parseFloat(distance) + 1.5)) + extraPrice,
                'low': parseFloat((low ? low.pricing_per_km : (category == scooterCategoryId ? 2.5 : 4)) * (parseFloat(distance) + 1.5)) + extraPrice,
            }
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/toggle-ready', verifyToken, async (req, res, next) => {

    try {
        const rider = await rider_model.findOne({ user_id: req.user.id, is_approved: true, is_active: true, }).select('is_ready')

        rider_model.updateOne({ user_id: req.user.id, is_approved: true, is_active: true, }, { is_ready: !rider.is_ready }).exec()

        res.json({
            'status': true,
            'data': !rider.is_ready,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/not-ready', verifyToken, async (req, res, next) => {

    try {

        rider_model.updateOne({ user_id: req.user.id, is_approved: true, is_active: true, }, { is_ready: false }).exec()

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/change-price', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { price } = req.body

        if (price > 4 || price < 2)
            return next({ 'status': 400, 'message': language == 'ar' ? 'يجب أن يتراوح نطاق السعر بين 2 و 4' : 'The Price Range is must Between 2 to 4' })

        const result = await rider_model.findOneAndUpdate({ user_id: req.user.id, is_approved: true, is_active: true, }, { pricing_per_km: price }).select('_id')

        if (!result) next({ 'status': 404, 'message': 'Not Found' })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/update-air-conditioner', verifyToken, async (req, res, next) => {

    try {

        const { status } = req.body

        const result = await rider_model.findOneAndUpdate({ user_id: req.user.id, is_approved: true, is_active: true, }, { airـconditioner: status }).select('_id')

        if (!result) next({ 'status': 404, 'message': 'Not Found' })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})


router.post('/update-car-model-year', verifyToken, async (req, res, next) => {

    try {

        const { car_model_year } = req.body

        const result = await rider_model.findOneAndUpdate({ user_id: req.user.id, is_approved: true, is_active: true, car_model_year: null }, { car_model_year }).select('_id')

        if (!result) next({ 'status': 404, 'message': 'Not Found' })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})


router.post('/update-phone', verifyToken, async (req, res, next) => {

    try {

        const { phone } = req.body

        const result = await rider_model.findOneAndUpdate({ user_id: req.user.id, is_approved: true, is_active: true }, { phone }).select('_id')

        if (!result) next({ 'status': 404, 'message': 'Not Found' })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/update-driving-license-front', verifyToken, async (req, res, next) => {

    try {

        const { path } = req.body

        if (!path) return next('Bad Request')

        await rider_model.updateOne({ user_id: req.user.id, is_active: true, }, { driving_license_front: path, is_approved: false })

        res.json({
            'status': true,

        })

    } catch (e) {
        next(e)
    }
})

router.post('/update-driving-license-behind', verifyToken, async (req, res, next) => {

    try {

        const { path } = req.body

        if (!path) return next('Bad Request')

        await rider_model.updateOne({ user_id: req.user.id, is_active: true, }, { driving_license_behind: path, is_approved: false })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/update-car-license-front', verifyToken, async (req, res, next) => {

    try {

        const { path } = req.body

        if (!path) return next('Bad Request')

        await rider_model.updateOne({ user_id: req.user.id, is_active: true, }, { car_license_front: path, is_approved: false })

        res.json({
            'status': true,

        })

    } catch (e) {
        next(e)
    }
})

router.post('/update-car-license-behind', async (req, res, next) => {

    try {

        const { path } = req.body

        if (!path) return next('Bad Request')

        await rider_model.updateOne({ user_id: req.user.id, is_active: true, }, { car_license_behind: path, is_approved: false })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/update-criminal-record', verifyToken, async (req, res, next) => {

    try {

        const { path } = req.body

        if (!path) return next('Bad Request')

        await rider_model.updateOne({ user_id: req.user.id, is_active: true, }, { criminal_record: path, is_approved: false })

        res.json({
            'status': true,
        })
    } catch (e) {
        next(e)
    }
})

router.post('/update-technical-examination', verifyToken, async (req, res, next) => {

    try {

        const { path } = req.body

        if (!path) return next('Bad Request')

        await rider_model.updateOne({ user_id: req.user.id, is_active: true, }, { technical_examination: path, is_approved: false })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/update-drug-analysis', verifyToken, async (req, res, next) => {

    try {

        const { path } = req.body

        if (!path) return next('Bad Request')

        await rider_model.updateOne({ user_id: req.user.id, is_active: true, }, { drug_analysis: path, is_approved: false })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/delete-registration', verifyToken, async (req, res, next) => {

    try {

        const rider = await rider_model.findOneAndDelete({ user_id: req.user.id })
        if (rider) {
            await Promise.all([
                ride_model.deleteMany({ rider_id: req.user.id }),
                rating_model.deleteMany({ user_id: req.user.id, category_id: rider.category_id }),
                user_model.updateOne({ _id: req.user.id }, { is_rider: false })
            ])
        }
        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-rider-rides', verifyToken, async (req, res, next) => {

    try {

        const { page } = req.query

        const result = await ride_model.find({ rider_id: req.user.id, is_completed: true }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20)

        const ratings = await rating_model.find({ user_id: req.user.id, ad_id: { $in: result.map(e => e.id) } })

        for (const ride of result) {
            ride._doc.sub_category_name = ''
            for (const rating of ratings) {
                if (rating.ad_id == ride.id) {
                    ride._doc.rating = rating
                    break
                }
            }
        }

        res.json({ 'status': true, 'data': result })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

///////////////////////////////////////////////// CLEINT /////////////////////////////////////////////////////////////

router.post('/new-ride-request', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { phone, car_model_year, air_conditioner, category_id, from, to, distance, time, lat, lng, destination_lat, destination_lng, price, passengers } = req.body

        if (category_id && from && to && distance && time && lat && lng && destination_lat && destination_lng) {

            const subCateogry = await sub_category_model.findOne({ _id: category_id, is_hidden: false, }).select('parent name_ar name_en parent')
            if (!subCateogry || subCateogry.parent != rideCategoryId) return next('Bad Request')

            const user = await user_model.findById(req.user.id).select('country_code')

            createOtherRequest(req.user.id, user.country_code, subCateogry.parent, subCateogry.name_ar, subCateogry.name_en, category_id, from, to, distance, time, lat, lng, destination_lat, destination_lng, price, passengers, phone, language, air_conditioner, car_model_year)

            // const cashBackRandom = Math.random() * 5

            // if (parseInt(cashBackRandom) == 3) {
            //     requestCashBack(req.user.id, language)
            // }

            res.json({ 'status': true });
        } else {
            next('Bad Request')
        }
    } catch (e) {
        next(e)
    }
})

router.delete('/cancel-ride', verifyToken, async (req, res, next) => {
    try {

        const { language } = req.headers

        const { id } = req.body

        if (!id) return next('Bad Request')

        const ride = await ride_model.findOne({ _id: id, is_completed: false, is_canceled: false })

        if (!ride) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الرحلة' : 'The Ride is not Exist' })


        if (ride.user_id == req.user.id || ride.rider_id == req.user.id) {
            ride_model.updateOne({ _id: id }, { is_canceled: true }).exec()
            rider_model.updateOne({ user_id: ride.rider_id }, { has_ride: false }).exec()

            axios.post(process.env.REAL_TIME_SERVER_URL + 'cancel-ride',
                {
                    ride_id: id,
                    user_id: ride.user_id == req.user.id ? ride.rider_id : ride.user_id,
                    rider_id: ride.rider_id,
                },
                {
                    headers:
                    {
                        'Key': process.env.REAL_TIME_SERVER_KEY
                    },
                },
            )

            //sendCancelRide(id, ride.user_id == req.user.id ? ride.rider_id : ride.user_id, ride.rider_id)

        }

        res.json({ 'status': true })

    } catch (e) {
        next(e)
    }
})


router.get('/rider-go-to-client/:rideId', verifyToken, async (req, res, next) => {

    try {

        const ride = await ride_model.findOne({ rider_id: req.user.id, is_start: false })

        if (ride) {
            axios.post(process.env.REAL_TIME_SERVER_URL + 'start-ride-timer',
                {
                    user_id: ride.user_id,
                },
                {
                    headers:
                    {
                        'Key': process.env.REAL_TIME_SERVER_KEY
                    },
                },
            )

            user_model.findById(ride.user_id).select('language').then(user => {

                auth_model.find({ user_id: ride.user_id }).distinct('fcm').then(fcm => {

                    const titleAr = 'الكابتن فى طريقه اليك'
                    const titleEn = 'The captain is on his way to you'
                    const bodyAr = 'الكابتن فى طريقه اليك فى حالة عدم ظهورك ستتحمل غرامة مالية الرجاء الاستعداد'
                    const bodyEn = 'The captain is on his way to you if you don\'t show up you will pay a financial penalty please standby'

                    sendNotifications(
                        fcm,
                        user.language == 'ar' ? titleAr : titleEn,
                        user.language == 'ar' ? bodyAr : bodyEn,
                        2022,
                    )
                })
            })
            return res.json({ 'status': true })
        }
        return next('Bad Request')
    } catch (e) { next(e) }
})

router.get('/send-arrived-to-client/:rideId', verifyToken, async (req, res, next) => {

    try {

        const ride = await ride_model.findOne({ rider_id: req.user.id, is_start: false })

        if (ride) {

            user_model.findById(ride.user_id).select('language').then(user => {

                auth_model.find({ user_id: ride.user_id }).distinct('fcm').then(fcm => {

                    const titleAr = 'لقد وصل الكابتن'
                    const titleEn = 'The captain has arrived'
                    const bodyAr = 'لقد وصل الكابتن الى المكان المحدد'
                    const bodyEn = 'The captain has arrived at the designated place'

                    sendNotifications(
                        fcm,
                        user.language == 'ar' ? titleAr : titleEn,
                        user.language == 'ar' ? bodyAr : bodyEn,
                        2022,
                    )
                })
            })
            return res.json({ 'status': true })
        }
        return next('Bad Request')
    } catch (e) { next(e) }
})

router.get('/client-not-arrived/:rideId', verifyToken, async (req, res, next) => {

    try {

        const financialPenalty = 10

        const ride = await ride_model.findOne({ _id: req.params.rideId, rider_id: req.user.id, is_start: false })

        if (ride) {

            ride_model.updateOne({ _id: req.params.rideId }, { is_canceled: true }).exec()
            rider_model.updateOne({ user_id: ride.rider_id }, { has_ride: false }).exec()
            wallet_model.updateOne({ user_id: ride.user_id }, { $inc: { balance: -financialPenalty } }).exec()

            axios.post(process.env.REAL_TIME_SERVER_URL + 'cancel-ride',
                {
                    ride_id: req.params.rideId,
                    user_id: ride.user_id,
                    rider_id: ride.rider_id,
                },
                {
                    headers:
                    {
                        'Key': process.env.REAL_TIME_SERVER_KEY
                    },
                },
            )

            user_model.findById(ride.user_id).select('language').then(user => {

                auth_model.find({ user_id: ride.user_id }).distinct('fcm').then(fcm => {

                    const titleAr = 'تم الغاء الرحلة'
                    const titleEn = 'The ride has been cancelled'
                    const bodyAr = `تم الغاء الرحلة وخصم ${financialPenalty} جنيه من رصيدك لعدم ظهورك`
                    const bodyEn = `The ride has been cancelled and ${financialPenalty} EGP has been deducted from your balance for not show`
                    sendNotifications(
                        fcm,
                        user.language == 'ar' ? titleAr : titleEn,
                        user.language == 'ar' ? bodyAr : bodyEn,
                        2022,
                    )
                })
            })

            user_model.findById(ride.rider_id).select('language').then(user => {

                auth_model.find({ user_id: ride.rider_id }).distinct('fcm').then(fcm => {

                    const titleAr = 'تم الغاء الرحلة'
                    const titleEn = 'The ride has been cancelled'
                    const bodyAr = `نأسف لذلك تم إلغاء الرحلة وخصم ${financialPenalty} جنيه من رصيد العميل لعدم ظهوره`
                    const bodyEn = `Sorry for that the ride was cancelled and ${financialPenalty} EGP was deducted from the client's balance for not showing up`

                    sendNotifications(
                        fcm,
                        user.language == 'ar' ? titleAr : titleEn,
                        user.language == 'ar' ? bodyAr : bodyEn,
                        2022,
                    )
                })
            })
            return res.json({ 'status': true })
        }
        return next('Bad Request')
    } catch (e) { next(e) }
})


router.post('/start-ride', verifyToken, async (req, res, next) => {
    try {

        const { language } = req.headers

        const { id } = req.body

        if (!id) return next('Bad Request')

        const ride = await ride_model.findOneAndUpdate({ _id: id, rider_id: req.user.id, is_completed: false, is_canceled: false, is_start: false }, { is_start: true })

        if (!ride) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الرحلة' : 'The Ride is not Exist' })

        //sendStartRide(id, ride.user_id)

        axios.post(process.env.REAL_TIME_SERVER_URL + 'start-ride',
            {
                ride_id: id,
                user_id: ride.user_id,
            },
            {
                headers:
                {
                    'Key': process.env.REAL_TIME_SERVER_KEY
                },
            },
        )
        res.json({ 'status': true })

    } catch (e) {
        next(e)
    }
})

router.post('/complete-ride', verifyToken, async (req, res, next) => {
    try {

        const { language } = req.headers

        const { id } = req.body

        if (!id) return next('Bad Request')

        const ride = await ride_model.findOneAndUpdate({ _id: id, rider_id: req.user.id, is_completed: false, is_canceled: false, is_start: true }, { is_completed: true })

        if (!ride) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الرحلة' : 'The Ride is not Exist' })

        rider_model.updateOne({ user_id: req.user.id }, {
            has_ride: false,
            $inc: {
                profit: ride.price,
                trips: 1,
            }
        }).exec()

        axios.post(process.env.REAL_TIME_SERVER_URL + 'complete-ride',
            {
                ride_id: id,
                user_id: ride.user_id,
                rider_id: ride.rider_id,
            },
            {
                headers:
                {
                    'Key': process.env.REAL_TIME_SERVER_KEY
                },
            },
        )

        //sendCompleteRide(id, ride.user_id, ride.rider_id)

        res.json({ 'status': true })

    } catch (e) {
        next(e)
    }
})

router.post('/rating-ride', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { field_one, field_two, field_three, comment, category_id, ad_id, user_id } = req.body

        if (!category_id || !ad_id || !user_id) return next('Bad Request')

        const category = await sub_category_model.findById(category_id).select('_id parent')

        if (category && category.parent == rideCategoryId) {

            if (comment.length > 100) return next({ 'stauts': 400, 'message': language == 'ar' ? 'أقصى عدد حروف للتعليق 100 حرف' : 'Max Comment length is 100 Letters' })

            await rating_model.updateOne({ user_rating_id: req.user.id, category_id, ad_id, user_id }, { field_one, field_two, field_three, comment, }, { upsert: true, new: true, setDefaultsOnInsert: true })

            updateRideRating(user_id, category_id)


            res.json({ 'status': true })

        } else return next('Bad Request')

    } catch (e) {
        next(e)
    }
})

router.delete('/delete-rating-ride', verifyToken, async (req, res, next) => {

    try {

        const { category_id, ad_id } = req.body
        const { language } = req.headers

        if (!category_id || !ad_id) return next('Bad Request')

        const result = await rating_model.findOneAndDelete({ user_rating_id: req.user.id, category_id, ad_id })

        if (!result) return next({ 'status': 400, 'message': language == 'ar' ? 'لا يوجد تقييم لهذا الاعلان' : 'No Rating for this Ad' })

        if (result && isTaxiOrCaptainOrScooter(category_id)) {
            updateRideRating(result.user_id)
        }

        res.json({ 'status': true })

    } catch (e) {
        next(e)
    }
})

router.get('/get-user-rides', verifyToken, async (req, res, next) => {
    try {

        const { language } = req.headers

        const { page } = req.query

        const result = await ride_model.find({ user_id: req.user.id, is_completed: true }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20)

        const riderIds = []
        const subCategoriesIds = []

        for (const ride of result) {
            if (!riderIds.includes(ride.rider_id))
                riderIds.push(ride.rider_id)
            if (!subCategoriesIds.includes(ride.category_id))
                subCategoriesIds.push(ride.category_id)
        }

        if (riderIds.length > 0) {

            const riders = await rider_model.find({ user_id: { $in: riderIds } })
            const ratings = await rating_model.find({ user_rating_id: req.user.id, ad_id: { $in: result.map(e => e.id) } })
            const users = await user_model.find({ _id: { $in: riderIds } }).select('first_name profile_picture')
            const categories = await sub_category_model.find({ _id: { $in: subCategoriesIds } }).select('_id name_ar name_en')

            for (const ride of result) {
                ride._doc.sub_category_name = ''

                for (const rider of riders) {
                    if (rider.user_id == ride.rider_id) {
                        ride._doc.rider_info = {
                            'id': rider.user_id,
                            'trips': rider.trips,
                            'name': '',
                            'picture': '',
                            'rating': rider.rating,
                            'car_brand': rider.car_brand,
                            'car_type': rider.car_type,
                            'car_plate_letters': rider.car_plate_letters,
                            'car_plate_numbers': rider.car_plate_numbers,
                        }
                        break
                    }
                }
                for (const user of users) {
                    if (user.id == ride.rider_id) {
                        if (ride._doc.rider_info) {
                            ride._doc.rider_info.name = user.first_name
                            ride._doc.rider_info.picture = user.profile_picture
                        }
                        break
                    }
                }
                for (const rating of ratings) {
                    if (rating.ad_id == ride.id) {
                        ride._doc.rating = rating
                        break
                    }
                }
                for (const category of categories) {
                    if (category.id == ride.category_id) {
                        ride._doc.sub_category_name = language == 'ar' ? category.name_ar : category.name_en
                        break
                    }
                }
            }
        }

        res.json({ 'status': true, 'data': result })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/send-ride-offer', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { adId, price } = req.body

        if (!adId || !price) return next('Bad Request')

        const user = await user_model.findById(req.user.id).select('first_name profile_picture')

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على السمتخدم' : 'The User is not Exist' })

        const ad = await ride_model.findOne({ _id: adId, is_start: false, is_completed: false, is_canceled: false })

        if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الاعلان' : 'The Ad is not Exist' })

        const rider = await rider_model.findOne({ user_id: req.user.id, is_approved: true, is_active: true, category_id: ad.category_id })

        if (!rider) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على البيانات' : 'The Data is not Exist' })

        const titleAr = 'عرض سعر جديد'
        const titleEn = 'New Offer'
        const bodyEn = `New Offer (${ad.to}), From ${user.first_name}, price offer ${price}, rating ${rider.rating}`
        const bodyAr = `عرض جديد ${ad.to} ,من ${user.first_name},عرض السعر ${price}, التقييم ${rider.rating}`

        const notificationObject = new notification_model({
            receiver_id: ad.user_id,
            user_id: req.user.id,
            sub_category_id: ad.category_id,
            tab: 2,
            text_ar: bodyAr,
            text_en: bodyEn,
            direction: ad.id,
            main_category_id: rideCategoryId,
            type: 10002,
            attachment: user.profile_picture,
            ad_owner: ad.user_id,
            request_price: price,
        })

        notificationObject.save()

        Promise.all([
            user_model.findById(ad.user_id).select('language'),
            auth_model.find({ 'user_id': ad.user_id }).distinct('fcm'),
        ]
        ).then(r => {
            const user = r[0]
            const fcm = r[1]
            sendNotifications(fcm, user.language == 'ar' ? titleAr : titleEn, user.language == 'ar' ? bodyAr : bodyEn, 10001)
        })
        res.json({ 'status': true })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/accept-ride-offer', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { adId, notificationId } = req.body

        if (!adId || !notificationId) return next('Bad Request')


        const ad = await ride_model.findOne({ _id: adId, user_id: req.user.id })

        if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الاعلان' : 'The Ad is not Exist' })

        if (ad.is_completed == true) return next({ 'status': 400, 'message': language == 'ar' ? 'الاعلان بالفعل مزود بمقدم خدمة' : 'The Ad is Already has service provider' })

        const notification = await notification_model.findOne({ _id: notificationId, receiver_id: req.user.id })

        if (!notification) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على العرض' : 'The Offer is not Exist' })

        const user = await user_model.findById(notification.user_id).select('_id language')

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على المستخدم' : 'The User is not Exist' })

        ride_model.updateOne({ _id: ad.id }, { rider_id: user.id, is_start: true, is_completed: true, price: notification.request_price }).exec()

        const rider = await rider_model.findOneAndUpdate({ user_id: user.id }, { $inc: { profit: notification.request_price, trips: 1 } }).exec()


        const titleAr = 'تم قبول عرض السعر'
        const titleEn = 'The Price Offer Accepted'
        const bodyEn = `Price Offer ${notification.request_price} for Ride ${ad.to} is Accepted, you can contact the customer now `
        const bodyAr = `تم قبول عرض السعر ${notification.request_price} مقابل لرحلة ${ad.to} ، يمكنك الاتصال بالعميل الآن`

        await notification_model.deleteMany({ direction: ad.id, is_accepted: false }).exec()

        const notificationObject = new notification_model({
            receiver_id: user.id,
            user_id: req.user.id,
            sub_category_id: ad.category_id,
            tab: 2,
            text_ar: bodyAr,
            text_en: bodyEn,
            direction: ad.id,
            type: 10003,
            ad_owner: req.user.id,
            is_accepted: true,
            main_category_id: rideCategoryId,
            phone: ad.phone,
        })

        notificationObject.save()


        auth_model.find({ 'user_id': user.id }).distinct('fcm').then(
            fcm => sendNotifications(fcm, user.language == 'ar' ? titleAr : titleEn, user.language == 'ar' ? bodyAr : bodyEn, 10003))


        const titleClientAr = 'تواصل مع الكابتن'
        const titleClientEn = 'Contact the captain.'
        const bodyClientAr = `الرجاء التواصل مع الكابتن بخصوص رحلتك`
        const bodyClientEn = 'Please contact the captain regarding your ride'

        const notificationClientObject = new notification_model({
            receiver_id: req.user.id,
            user_id: user.id,
            sub_category_id: ad.category_id,
            tab: 2,
            text_ar: bodyClientAr,
            text_en: bodyClientEn,
            direction: ad.id,
            type: 10003,
            ad_owner: req.user.id,
            is_accepted: true,
            main_category_id: rideCategoryId,
            phone: rider.phone,
        })

        notificationClientObject.save()


        auth_model.find({ 'user_id': req.user.id }).distinct('fcm').then(
            fcm => sendNotifications(fcm, language == 'ar' ? titleClientAr : titleClientEn, language == 'ar' ? bodyClientAr : bodyClientEn, 10003))

        res.json({ 'status': true })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.delete('/delete-ride-request/:requestId', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const result = await ride_model.findOneAndDelete({ _id: req.params.requestId, user_id: req.user.id, })

        if (!result) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الطلب' : 'The Request is not Exist' })

        if (result) {
            notification_model.deleteMany({
                direction: req.params.requestId,
            }).exec()
        }
        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})


/////////////////// COME WITH YOU ////////////////////////

router.post('/add-come-with-me-trip', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { phone, car_brand, car_type, user_lat, user_lng, destination_lat, destination_lng, from, to, distance, duration, passengers, price, is_repeat, time } = req.body

        if (!car_brand || !car_type || !user_lat || !user_lng || !destination_lat || !destination_lng || !from || !to || !distance || !duration || !passengers || !price || !time) return next('Bad Request')

        const user = await user_model.findById(req.user.id).select('country_code')

        if (!user) return next({ 'status': 400, 'message': language == 'ar' ? 'الحساب ليس موجود' : 'The Account is not exist' })

        const object = new come_with_me_ride_model({
            user_id: req.user.id,
            country_code: user.country_code,
            car_brand,
            car_type,
            user_lat, user_lng,
            destination_lat,
            destination_lng,
            from,
            to,
            distance,
            duration,
            passengers,
            price,
            is_repeat,
            time,
            phone,
        })

        await object.save()

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-come-with-me-trip', tryVerify, async (req, res, next) => {

    try {

        var result

        if (req.user)
            result = await come_with_me_ride_model.findOne({ user_id: req.user.id }).select(comeWithMeTripKeys)

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-my-come-with-me-trips', verifyToken, async (req, res, next) => {

    try {

        const { page } = req.query
        const result = await come_with_me_ride_model.find({ user_id: req.user.id, is_approved: true }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20).select(comeWithMeTripKeys)

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})


router.delete('/delete-come-with-me-trip', verifyToken, async (req, res, next) => {

    try {

        const result = await come_with_me_ride_model.findOneAndDelete({ user_id: req.user.id }).select('_id')

        res.json({
            'status': result != null,

        })
    } catch (e) {
        next(e)
    }
})

router.get('/get-come-with-trips', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const user = await user_model.findById(req.user.id).select('country_code')

        if (!user) return next({ 'status': 400, 'message': language == 'ar' ? 'الحساب ليس موجود' : 'The Account is not exist' })


        const result = await come_with_me_ride_model.find({ country_code: user.country_code })
            .sort({ createdAt: -1, _id: 1 })
            .skip((((page ?? 1) - 1) * 20))
            .limit(20)
            .select(comeWithMeTripKeys)

        if (result.length == 0) return res.json({ 'status': true, 'data': [] })

        const usersIds = [req.user.id]

        result.forEach(e => {
            if (!usersIds.includes(e.user_id)) usersIds.push(e.user_id)
        })

        const subscriptions = await subscription_model.find({ sub_category_id: comeWithYouCategoryId, user_id: { $in: usersIds } }).distinct('user_id')

        result.forEach(ad => {
            ad._doc.is_subscription = subscriptions.includes(ad.user_id) || subscriptions.includes(req.user.id)
        })

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/come-with-me-request', verifyToken, async (req, res, next) => {
    try {

        const { language } = req.headers

        const { ad_id ,phone} = req.body

        if (!ad_id) return next('Bad Request')

        const result = await come_with_me_ride_model.findOne({ _id: ad_id, requests: { $nin: [req.user.id] } }).select(comeWithMeTripKeys)

        if (result && result.user_id != req.user.id) {

            come_with_me_ride_model.updateOne(
                { _id: ad_id },
                { $addToSet: { requests: req.user.id } },
            ).exec()

            requestCashBack(req.user.id, language)

            const subCategory = await sub_category_model.findById(comeWithYouCategoryId).select('name_ar name_en')

            const adOwnerUser = await user_model.findById(result.user_id).select('language')
            const adOwnerFcm = await auth_model.find({ user_id: result.user_id }).distinct('fcm')

            const titleAr = 'طلب جديد'
            const titleEn = 'New Request'

            const bodyAr = `شخص ما يريد التواصل معك بخصوص اعلانك فى ${subCategory.name_ar},  يرجى الاشترك للتواصل معه`
            const bodyEn = `Someone wants to contact you about your ad in ${subCategory.name_en}, please subscribe to get in touch with him`

            const notifcationObject = new notification_model({
                text_ar: bodyAr,
                text_en: bodyEn,
                receiver_id: result.user_id,
                tab: 2,
                user_id: req.user.id,
                type: 10009,
                direction: ad_id,
                sub_category_id: comeWithYouCategoryId,
                main_category_id: rideCategoryId,
                is_accepted: true,
                phone,
            })
            notifcationObject.save()

            if (adOwnerUser && adOwnerFcm) {

                sendNotifications(
                    adOwnerFcm,
                    adOwnerUser.language == 'ar' ? titleAr : titleEn,
                    adOwnerUser.language == 'ar' ? bodyAr : bodyEn,
                    10009,
                    ad_id
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

/////////////////// PICK ME ////////////////////////

router.post('/add-pick-me-trip', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { phone, user_lat, user_lng, destination_lat, destination_lng, from, to, distance, duration, passengers, price, is_repeat, time } = req.body

        if (!user_lat || !user_lng || !destination_lat || !destination_lng || !from || !to || !distance || !duration || !passengers || !price || !time) return next('Bad Request')

        const user = await user_model.findById(req.user.id).select('country_code')

        if (!user) return next({ 'status': 400, 'message': language == 'ar' ? 'الحساب ليس موجود' : 'The Account is not exist' })

        const object = new pick_me_ride_model({
            user_id: req.user.id,
            country_code: user.country_code,
            user_lat, user_lng,
            destination_lat,
            destination_lng,
            from,
            to,
            distance,
            duration,
            passengers,
            price,
            is_repeat,
            time,
            phone,
        })

        await object.save()

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-pick-me-trip', tryVerify, async (req, res, next) => {

    try {

        var result = null
        if (req.user)
            result = await pick_me_ride_model.findOne({ user_id: req.user.id }).select(pickMeTripKeys)

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-me-pick-me-trips', verifyToken, async (req, res, next) => {

    try {

        const result = await pick_me_ride_model.find({ user_id: req.user.id, is_approved: true }).select(pickMeTripKeys)

        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.delete('/delete-pick-me-trip', verifyToken, async (req, res, next) => {

    try {

        const result = await pick_me_ride_model.findOneAndDelete({ user_id: req.user.id }).select('_id')

        res.json({
            'status': result != null,

        })
    } catch (e) {
        next(e)
    }
})

router.get('/get-pick-me-trips', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const user = await user_model.findById(req.user.id).select('country_code')

        if (!user) return next({ 'status': 400, 'message': language == 'ar' ? 'الحساب ليس موجود' : 'The Account is not exist' })


        const result = await pick_me_ride_model.find({ country_code: user.country_code })
            .sort({ createdAt: -1, _id: 1 })
            .skip((((page ?? 1) - 1) * 20))
            .limit(20)
            .select(pickMeTripKeys)

        if (result.length == 0) return res.json({ 'status': true, 'data': [] })

        const usersIds = [req.user.id]

        result.forEach(e => {
            if (!usersIds.includes(e.user_id)) usersIds.push(e.user_id)
        })

        const subscriptions = await subscription_model.find({ sub_category_id: pickMeCategoryId, user_id: { $in: usersIds } }).distinct('user_id')

        result.forEach(ad => {
            ad._doc.is_subscription = subscriptions.includes(ad.user_id) || subscriptions.includes(req.user.id)

        })
        res.json({
            'status': true,
            'data': result,
        })

    } catch (e) {
        next(e)
    }
})

router.post('/pick-me-request', verifyToken, async (req, res, next) => {
    try {

        const { language } = req.headers

        const { ad_id , phone } = req.body

        if (!ad_id) return next('Bad Request')

        const result = await pick_me_ride_model.findOne({ _id: ad_id, requests: { $nin: [req.user.id] } }).select(pickMeTripKeys)

        if (result && result.user_id != req.user.id) {

            pick_me_ride_model.updateOne(
                { _id: ad_id },
                { $addToSet: { requests: req.user.id } },
            ).exec()

            requestCashBack(req.user.id, language)

            const subCategory = await sub_category_model.findById(pickMeCategoryId).select('name_ar name_en')

            const adOwnerUser = await user_model.findById(result.user_id).select('language')
            const adOwnerFcm = await auth_model.find({ user_id: result.user_id }).distinct('fcm')

            const titleAr = 'طلب جديد'
            const titleEn = 'New Request'

            const bodyAr = `شخص ما يريد التواصل معك بخصوص اعلانك فى ${subCategory.name_ar},  يرجى الاشترك للتواصل معه`
            const bodyEn = `Someone wants to contact you about your ad in ${subCategory.name_en}, please subscribe to get in touch with him`

            const notifcationObject = new notification_model({
                text_ar: bodyAr,
                text_en: bodyEn,
                receiver_id: result.user_id,
                tab: 2,
                user_id: req.user.id,
                type: 10009,
                direction: ad_id,
                sub_category_id: pickMeCategoryId,
                main_category_id: rideCategoryId,
                is_accepted: true,
                phone,
            })
            notifcationObject.save()

            if (adOwnerUser && adOwnerFcm) {

                sendNotifications(
                    adOwnerFcm,
                    adOwnerUser.language == 'ar' ? titleAr : titleEn,
                    adOwnerUser.language == 'ar' ? bodyAr : bodyEn,
                    10009,
                    ad_id
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

async function updateRideRating(riderId, category_id) {

    try {
        var result = await rating_model.aggregate(
            [
                { $match: { user_id: riderId, category_id } },
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
            rider_model.updateOne({ user_id: riderId }, { rating: parseFloat(total).toFixed(2) }).exec()
        }
        else rider_model.updateOne({ user_id: riderId }, { rating: 5.0 }).exec()

    } catch (e) {
        console.log(e)
    }
}
export default router