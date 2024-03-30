import express from 'express'
import rider_model from '../../models/rider_model.js';
import subscription_model from '../../models/subscription_model.js';
import app_manager_model from '../../models/app_manager_model.js';
import sub_category_model from '../../models/sub_category_model.js';
import notification_model from '../../models/notification_model.js';
import request_offer_model from '../../models/ride_offer.js';
import user_model from '../../models/user_model.js'
import auth_model from '../../models/auth_model.js'
import ride_model from '../../models/ride_model.js';
import rating_model from '../../models/rating_model.js';
import ride_request_logs from '../../models/ride_request_logs.js';

import { verifyToken, comeWithMeTripKeys, pickMeTripKeys, tryVerify } from '../../helper.js'
import { sendNotifications } from '../../controllers/notification_controller.js'
import { comeWithYouCategoryId, scooterCategoryId, createOtherRequest, isTaxiOrCaptainOrScooter, pickMeCategoryId, rideCategoryId, womenOnlyCategoryId } from '../../controllers/ride_controller.js'
import { requestCashBack } from '../../controllers/cash_back_controller.js';
import come_with_me_ride_model from '../../models/come_with_me_ride_model.js';
import pick_me_ride_model from '../../models/pick_me_ride_model.js';
import axios from 'axios';
import wallet_model from '../../models/wallet_model.js';
import handel_validation_errors from '../../middleware/handelBodyError.js';
import getLocation, { acceptRideOfferValidation, addNormalRide, changeRideOfferStatus, sendClientOfferValidation, sendRideValidation } from '../../validation/riders.js';
import { updateUserLocation } from '../../validation/user.js';
import mongoose from 'mongoose';


const router = express.Router()


///////////////////////////////////////////////// RIDER /////////////////////////////////////////////////////////////

// get the manager info
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

// register a new rider
/**
 * capiten => mohafazat => buses man
 */
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

// get the highest and the lowest price for this distance in all riders

/**
 * 
 */
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

// toggle rider is_ready attribute if ready make it ready if not make it not ready
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

// make rider not ready
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

// make rider change his price but price should be less than 2 and more than 4
router.post('/change-price', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { price } = req.body
        const info = await app_manager_model.findOne({}).select('high_cost_per_kilo low_cost_per_kilo')

        if (price > info.high_cost_per_kilo || price < info.low_cost_per_kilo)
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

// update air conditioner for the rider car acording to state as true or false
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

// update car model year
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

// update rider phone
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

// get rider details
router.get('/rider-details', verifyToken, async (req, res, next) => {

    try {
        const result = await rider_model.findOne({ user_id: req.user.id, is_approved: true, is_active: true })

        res.json({
            'status': true,
            data : result
        })

    } catch (e) {
        next(e)
    }
})

// update rider phone
router.put('/update-rider-location' , getLocation() , handel_validation_errors, verifyToken, async (req, res, next) => {

    try {

        const { longitude , latitude } = req.body

        const result = await rider_model.findOneAndUpdate({ user_id: req.user.id, is_approved: true, is_active: true }, { "location.coordinates" : [parseFloat(longitude), parseFloat(latitude)] }).select('_id')

        if (!result) next({ 'status': 404, 'message': 'Not Found' })

        res.json({
            'status': true,
        })

    } catch (e) {
        next(e)
    }
})

// update-driving-license-front
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

router.get('/client-request' , verifyToken, async (req, res, next) => {

    try {
        const userRequest = await ride_model.find({
            user_id : req.user.id
        })
        res.json({ 'status': true , data : userRequest});
    } catch (e) {
        next(e)
    }
})

router.get('/client-request/:id' , verifyToken, async (req, res, next) => {

    try {
        const userRequest = await ride_model.findOne({
            user_id : req.user.id,
            _id : req.params.id
        })
        res.json({ 'status': true , data : userRequest});
    } catch (e) {
        next(e)
    }
})
 
router.put('/update-client-request/:id' , verifyToken, async (req, res, next) => {

    try {
        const {id} = req.params
        const body = req.body

        const userRequest = await ride_model.findOneAndUpdate({user_id : req.user.id , _id : id} , body , {new : true})

        res.json({ 'status': true , data : userRequest});
    } catch (e) {
        next(e)
    }
})

router.post('/new-ride-request' , addNormalRide() , handel_validation_errors , verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers
        const { phone, car_model_year, air_conditioner, category_id, from, to, distance, time, user_lat, user_lng, destination_lat, destination_lng, price, passengers } = req.body
        const info = await app_manager_model.findOne({}).select('ride_request_cash_back')

        const subCateogry = await sub_category_model.findOne({ _id: category_id, is_hidden: false, }).select('parent name_ar name_en parent')
        if (!subCateogry || subCateogry.parent != rideCategoryId) return next('Bad Request')

        const user = await user_model.findById(req.user.id).select('country_code')
        const allRides = await createOtherRequest(req.user.id, user?.country_code, subCateogry.parent, subCateogry.name_ar, subCateogry.name_en, category_id, from, to, distance, time, user_lat, user_lng, destination_lat, destination_lng, price, passengers, phone, language, air_conditioner, car_model_year )
        await ride_request_logs.create({
            user_id : req.user.id
        })
        if(info.ride_request_cash_back) {
            await requestCashBack(req.user.id , language)
        }

        res.json({ 'status': true , allRides});
    } catch (e) {
        next(e)
    }
})

router.delete('/cancel-ride/:id', verifyToken, async (req, res, next) => {
    try {

        const { language } = req.headers

        const { id } = req.params
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

            //sendCancelRide(id, ride.user_id == req.user.id ? ride.rider_id : ride.user_id , ride.rider_id)

        }

        res.json({ 'status': true })

    } catch (e) {
        next(e)
    }
})

router.get('/rider-five-kilometers-away' , verifyToken , getLocation() , handel_validation_errors , async (req, res, next) => {
    try {
        const { longitude, latitude } = req.query; // Get the longitude and latitude from the request query parameters
        const info = await app_manager_model.findOne({}).select('ride_area_distance')
        const page = req.query.page || process.env.page;
        const limit = req.query.limit || process.env.limit;
        const search = req.query.search?.trim();
        const queryObj = {is_active : true , is_approved : true , is_ready : true};
        if(search){
          queryObj.car_brand = {'$regex' :  search, '$options' : 'i'}
        }
        const aggregate = rider_model.aggregate([
     
            {
              $geoNear: {
                near: {
                  type: 'Point',
                  coordinates: [parseFloat(longitude), parseFloat(latitude)]
                },
                distanceField: 'location',
                spherical: true,
                maxDistance: info.ride_area_distance ?? process.env.maxDistance // 5 km in meters
              }
            },
            {
                $match : queryObj
            },
          ]);
          const riders = await rider_model.aggregatePaginate(aggregate , {page , limit , sort : {
            createdAt : -1,
          }})
          res.json(riders);
    } catch (e) { next(e) }
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
        if (comment.length > 100) return next({ 'stauts': 400, 'message': language == 'ar' ? 'أقصى عدد حروف للتعليق 100 حرف' : 'Max Comment length is 100 Letters' })

        if (!category_id || !ad_id || !user_id) return next('Bad Request')

        const category = await sub_category_model.findById(category_id).select('_id parent')

        if (category && category.parent == rideCategoryId) {


            await rating_model.updateOne({ user_rating_id: req.user.id, category_id, ad_id, user_id }, { field_one, field_two, field_three, comment, }, { upsert: true, new: true, setDefaultsOnInsert: true })

            updateRideRating(user_id, category_id)


            res.json({ 'status': true })

        } else return next('Bad Request')

    } catch (e) {
        next(e)
    }
})

// انا خلصت get order , cancel order , update order , get orders الخاصين بالمستخدم بس

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

router.post('/send-ride-offer/:adId' , sendRideValidation() , handel_validation_errors , verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers
        const { price } = req.body  
        const { adId } = req.params 

        const user = await user_model.findById(req.user.id).select('first_name profile_picture')

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على السمتخدم' : 'The User is not Exist' })

        const ad = await ride_model.findOne({ _id: adId, is_start: false, is_completed: false, is_canceled: false })

        if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الاعلان' : 'The Ad is not Exist' })
        
        const rider = await rider_model.findOne({ user_id: req.user.id, is_approved: true, is_active: true, category_id: ad.category_id })

        if (!rider) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على البيانات' : 'The rider is not Exist' })

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
        const offer = await request_offer_model.create({
            to : ad.user_id,
            from : req.user.id,
            price_offer: price,
            ride_id : adId
        })
        Promise.all([
            user_model.findById(ad.user_id).select('language'),
            auth_model.find({ 'user_id': ad.user_id }).distinct('fcm'),
        ]
        ).then(r => {
            const user = r[0]
            const fcm = r[1]
            sendNotifications(fcm, user.language == 'ar' ? titleAr : titleEn, user.language == 'ar' ? bodyAr : bodyEn, 10001)
        })
        res.json({ 'status': true , offer})

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/send-client-offer/:adId' , sendClientOfferValidation() , handel_validation_errors , verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { price , riderId } = req.body  
        const { adId } = req.params 

        const user = await user_model.findById(riderId).select('first_name profile_picture')
        const theUser = await user_model.findById(req.user.id).select('first_name profile_picture')

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على السمتخدم' : 'The User is not Exist' })

        const ad = await ride_model.findOne({ _id: adId, is_start: false, is_completed: false, is_canceled: false })

        if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الاعلان' : 'The Ad is not Exist' })
        const rider = await rider_model.findOne({ user_id: user.id, is_approved: true, is_active: true, category_id: ad.category_id })

        if (!rider) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على البيانات' : 'The rider is not Exist' })

        const titleAr = 'عرض سعر جديد' 
        const titleEn = 'New Offer'     
        const bodyEn = `New Offer (${ad.to}), From ${theUser.first_name}, price offer ${price}`
        const bodyAr = `عرض جديد ${ad.to} ,من ${theUser.first_name},عرض السعر ${price}`

        const notificationObject = new notification_model({
            receiver_id: user.id,
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
        await request_offer_model.create({
            to : riderId,
            from : req.user.id,
            price_offer: price,
            ride_id : adId
        })
        Promise.all([
            user_model.findById(user.id).select('language'),
            auth_model.find({ 'user_id': user.id }).distinct('fcm'),
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

router.post('/accept-ride-offer/:offer' , verifyToken, async (req, res, next) => {
    try {

        const { language } = req.headers
        const { offerId } = req.params 
        const offerData = await request_offer_model.findOne({_id : offerId , to : req.user.id}).populate("ride_id")
        if (!offerData) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الاعلان' : 'The Ad is not Exist' })

        if (offerData.ride_id.is_completed == true) return next({ 'status': 400, 'message': language == 'ar' ? 'الاعلان بالفعل مزود بمقدم خدمة' : 'The Ad is Already has service provider' })
        const user = await user_model.findById(offerData.from).select('_id language')

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على المستخدم' : 'The User is not Exist' })

        ride_model.updateOne({ _id: offerData.ride_id.id }, { rider_id: offerData.from, is_start: true, is_completed: true, price: offerData.price }).exec()

        const rider = await rider_model.findOneAndUpdate({ user_id: offerData.from }, { $inc: { profit: offerData.price, trips: 1 } }).exec()
        
        const titleAr = 'تم قبول عرض السعر'
        const titleEn = 'The Price Offer Accepted'
        const bodyEn = `Price Offer ${offerData.price} for Ride ${offerData.ride_id.to} is Accepted, you can contact the customer now `
        const bodyAr = `تم قبول عرض السعر ${offerData.price} مقابل لرحلة ${offerData.ride_id.to} ، يمكنك الاتصال بالعميل الآن`

        await notification_model.deleteMany({ direction: ad.id, is_accepted: false }).exec()
        await request_offer_model.updateOne({_id : offerId} , {is_accept : true})
        await request_offer_model.deleteMany({
            is_accept : false,
            ride_id : offerData.ride_id.id
        })
        const notificationObject = new notification_model({
            receiver_id: offerData.from,
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
            phone: offerData.ride_id.phone,
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
            user_id: offerData.from,
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

router.post('/reject-ride-offer/:offer' , verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers
        const { offerId } = req.params  
        const offerData = await request_offer_model.findOne({_id : offerId , to : req.user.id}).populate("ride_id")

        if (!offerData) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الاعلان' : 'The Ad is not Exist' })

        const titleAr = 'تم رفض عرض السعر'
        const titleEn = 'The Price Offer rejected'
        const bodyEn = `Price Offer ${notification.request_price} for Ride ${ad.to} is rejected, you can add another offer now `
        const bodyAr = `تم رفض عرض السعر ${notification.request_price} مقابل لرحلة ${ad.to} ، يمكنك ارسال عرض طلب اخر`

        const notificationObject = new notification_model({
            receiver_id: offerData.from,
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
            phone: offerData.ride_id.phone,
        })

        notificationObject.save()


        auth_model.find({ 'user_id': user.id }).distinct('fcm').then(
            fcm => sendNotifications(fcm, user.language == 'ar' ? titleAr : titleEn, user.language == 'ar' ? bodyAr : bodyEn, 10003))

        res.json({ 'status': true })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/get-requests-offers' , verifyToken , async (req, res, next) => {

    try {
        let {page = process.env.PAGE , limit = process.env.LIMIT} = req.query
        const aggregate = request_offer_model.aggregate([
            {   
                $match : {
                    status : true,
                    to : new mongoose.Types.ObjectId(req.user.id)
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "to",
                    foreignField : "_id",
                    as : "to"
                }
            },
            {
                $unwind : {
                    path : "$to",
                    preserveNullAndEmptyArrays : true
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "from",
                    foreignField : "_id",
                    as : "from"
                }
            },
            {
                $unwind : {
                    path : "$from",
                    preserveNullAndEmptyArrays : true
                }
            },
            {
                $lookup : {
                    from : "rides",
                    localField : "ride_id",
                    foreignField : "_id",
                    as : "rides"
                }
            },
            {
                $unwind : {
                    path : "$rides",
                    preserveNullAndEmptyArrays : true
                }
            }
        ])
        const offers = await request_offer_model.aggregatePaginate(aggregate , {page , limit})
        res.json({ 'status': true , data : offers })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.put('/change-offer_status/:id' , changeRideOfferStatus() , handel_validation_errors , async (req, res, next) => {
    const {status } = req.body
    const {id} = req.params
    const offer = await request_offer_model.findOneAndUpdate({_id : id} , {status} , {new : true})
    res.json({ 'status': true , data : offer })
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