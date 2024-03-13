import express from 'express'
import wallet_model from '../models/wallet_model.js'
import dynamic_ad_model from '../models/dynamic_ad_model.js'

import { verifyToken } from '../helper.js'
import { callCashBack, anyCashBack } from '../controllers/cash_back_controller.js'
import ride_model from '../models/ride_model.js'
import come_with_me_ride_model from '../models/come_with_me_ride_model.js'
import pick_me_ride_model from '../models/pick_me_ride_model.js'

import { comeWithYouCategoryId, isTaxiOrCaptainOrScooter, pickMeCategoryId } from '../controllers/ride_controller.js'
import { startSubscriptionCounter } from './subscription.js'
import loading_trip_model from '../models/loading_trip_model.js'
import restaurant_model from '../models/restaurant_model.js'
import doctor_model from '../models/doctor_model.js'
import subscription_model from '../models/subscription_model.js'

const router = express.Router()

router.post('/call', verifyToken, async (req, res, next) => {
    try {

        const { language } = req.headers

        const { ad_id } = req.body

        if (!ad_id) return next('Bad Request')

        const ad = await dynamic_ad_model.findOne({ _id: ad_id, is_active: true, is_approved: true }).select('user_id sub_category_id')

        if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'الاعلان غير موجود' : 'The Ad not exist' })

        const subscriptions = await subscription_model.findOne({ sub_category_id: ad.sub_category_id, $or: [{ user_id: req.user.id }, { user_id: ad.user_id }] })


        if (subscriptions) {

            startSubscriptionCounter(ad.sub_category_id, req.user.id, language)
            startSubscriptionCounter(ad.sub_category_id, ad.user_id, language)
            dynamic_ad_model.findOne({ _id: ad_id, calls: { $nin: req.user.id } }).select('user_id').then(isInCall => {
                if (isInCall) {
                    const cashBackRandom = Math.random() * 5

                    if (parseInt(cashBackRandom) == 3) {
                        dynamic_ad_model.updateOne(
                            { _id: ad_id },
                            { $addToSet: { calls: req.user.id } },
                        ).exec()
                        callCashBack(req.user.id, language)
                    }
                }
            })
        }

        res.json({
            'status': subscriptions != null
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/ride-call', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { ride_id, category_id } = req.body

        if (!ride_id || !category_id) return next('Bad Request')


        if (category_id == comeWithYouCategoryId) {

            const ad = await come_with_me_ride_model.findOne({ _id: ride_id }).select('user_id')

            if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'الاعلان غير موجود' : 'The Ad not exist' })

            const subscriptions = await subscription_model.findOne({ sub_category_id: comeWithYouCategoryId, $or: [{ user_id: req.user.id }, { user_id: ad.user_id }] })

            if (subscriptions) {

                startSubscriptionCounter(comeWithYouCategoryId, req.user.id, language)
                startSubscriptionCounter(comeWithYouCategoryId, ad.user_id, language)

                come_with_me_ride_model.findOne({ _id: ride_id, calls: { $nin: req.user.id } }).select('user_id').then(isInCall => {
                    if (isInCall) {
                        const cashBackRandom = Math.random() * 5

                        if (parseInt(cashBackRandom) == 3) {
                            come_with_me_ride_model.updateOne(
                                { _id: ride_id },
                                { $addToSet: { calls: req.user.id } },
                            ).exec()
                            callCashBack(req.user.id, language)
                        }
                    }
                })
            }

            return res.json({
                'status': subscriptions != null
            })
            /*const result = await come_with_me_ride_model.findOne({ _id: ride_id, calls: { $nin: [req.user.id] } }).select('_id')


            startSubscriptionCounter(comeWithYouCategoryId, req.user.id, language)
            if (result)
                startSubscriptionCounter(comeWithYouCategoryId, result.user_id, language)

            if (result) {

                callCashBack(req.user.id, language)

                come_with_me_ride_model.updateOne({ _id: ride_id }, { $addToSet: { calls: req.user.id } }).exec()

                return res.json({
                    'status': true,
                })
            }*/
        }
        else if (category_id == pickMeCategoryId) {

            const ad = await pick_me_ride_model.findOne({ _id: ride_id }).select('user_id')

            if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'الاعلان غير موجود' : 'The Ad not exist' })

            const subscriptions = await subscription_model.findOne({ sub_category_id: pickMeCategoryId, $or: [{ user_id: req.user.id }, { user_id: ad.user_id }] })

            if (subscriptions) {

                startSubscriptionCounter(pickMeCategoryId, req.user.id, language)
                startSubscriptionCounter(pickMeCategoryId, ad.user_id, language)

                pick_me_ride_model.findOne({ _id: ride_id, calls: { $nin: req.user.id } }).select('user_id').then(isInCall => {
                    if (isInCall) {
                        const cashBackRandom = Math.random() * 5

                        if (parseInt(cashBackRandom) == 3) {
                            pick_me_ride_model.updateOne(
                                { _id: ride_id },
                                { $addToSet: { calls: req.user.id } },
                            ).exec()
                            callCashBack(req.user.id, language)
                        }
                    }
                })
            }

            return res.json({
                'status': subscriptions != null
            })

            /* const result = await pick_me_ride_model.findOne({ _id: ride_id, calls: { $nin: [req.user.id] } }).select('_id')
 
             startSubscriptionCounter(pickMeCategoryId, req.user.id, language)
 
             if (result) {
 
                 startSubscriptionCounter(pickMeCategoryId, result.user_id, language)
                 callCashBack(req.user.id, language)
 
                 pick_me_ride_model.updateOne({ _id: ride_id }, { $addToSet: { calls: req.user.id } }).exec()
 
                 return res.json({
                     'status': true,
                 })
             }*/

        } else {


            const ad = await ride_model.findOne({ _id: ride_id }).select('user_id rider_id category_id is_rider_get_cashback is_user_get_cashback')

            if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'الاعلان غير موجود' : 'The Ad not exist' })

            const subscriptions = await subscription_model.findOne({ sub_category_id: ad.category_id, $or: [{ user_id: req.user.id }, { user_id: ad.user_id }] })

            if (subscriptions) {

                startSubscriptionCounter(ad.category_id, req.user.id, language)
                startSubscriptionCounter(ad.category_id, ad.user_id, language)

                if (ad.rider_id == req.user.id && ad.is_rider_get_cashback == false) {

                    const cashBackRandom = Math.random() * 5

                    if (parseInt(cashBackRandom) == 3) {
                        ride_model.updateOne(
                            { _id: ride_id },
                            { is_rider_get_cashback: true },
                        ).exec()
                        callCashBack(req.user.id, language)
                    }
                }
                else if (ad.user_id == req.user.id && ad.is_user_get_cashback == false) {

                    const cashBackRandom = Math.random() * 5

                    if (parseInt(cashBackRandom) == 3) {
                        ride_model.updateOne(
                            { _id: ride_id },
                            { is_user_get_cashback: true },
                        ).exec()
                        callCashBack(req.user.id, language)
                    }
                }
            }

            return res.json({
                'status': subscriptions != null
            })

            /*const userCashback = await ride_model.findOne({ _id: ride_id, user_id: req.user.id }).select('_id category_id is_user_get_cashback')


            if (userCashback && userCashback.is_user_get_cashback == false) {

                startSubscriptionCounter(userCashback.category_id, req.user.id, language)
                startSubscriptionCounter(userCashback.category_id, userCashback.user_id, language)
                callCashBack(req.user.id, language)

                ride_model.updateOne({ _id: ride_id }, { is_user_get_cashback: true }).exec()

                return res.json({
                    'status': true,
                })
            }

            const riderCashback = await ride_model.findOne({ _id: ride_id, rider_id: req.user.id }).select('_id category_id is_rider_get_cashback')


            if (riderCashback && riderCashback.is_rider_get_cashback == false) {

                startSubscriptionCounter(riderCashback.category_id, req.user.id, language)
                startSubscriptionCounter(riderCashback.category_id, riderCashback.user_id, language)

                callCashBack(req.user.id, language)

                ride_model.updateOne({ _id: ride_id }, { is_rider_get_cashback: true }).exec()

                return res.json({
                    'status': true,
                })
            }*/
        }

        res.json({
            'status': false,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/loading-call', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { ride_id } = req.body

        if (!ride_id) return next('Bad Request')

        const ad = await loading_trip_model.findOne({ _id: ride_id }).select('user_id category_id')

        if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'الاعلان غير موجود' : 'The Ad not exist' })

        const subscriptions = await subscription_model.findOne({ sub_category_id: ad.category_id, $or: [{ user_id: req.user.id }, { user_id: ad.user_id }] })

        if (subscriptions) {

            startSubscriptionCounter(ad.category_id, req.user.id, language)
            startSubscriptionCounter(ad.category_id, ad.user_id, language)

            loading_trip_model.findOne({ _id: ride_id, calls: { $nin: req.user.id } }).select('user_id').then(isInCall => {
                if (isInCall) {
                    const cashBackRandom = Math.random() * 5

                    if (parseInt(cashBackRandom) == 3) {
                        loading_trip_model.updateOne(
                            { _id: ride_id },
                            { $addToSet: { calls: req.user.id } },
                        ).exec()
                        callCashBack(req.user.id, language)
                    }
                }
            })
        }

        res.json({
            'status': subscriptions != null
        })

        /* const result = await loading_trip_model.findOne({ _id: ride_id, calls: { $nin: [req.user.id] } }).select('_id category_id')
 
         if (result) {
 
             startSubscriptionCounter(result.category_id, req.user.id, language)
 
             startSubscriptionCounter(result.category_id, result.user_id, language)
 
             callCashBack(req.user.id, language)
 
             loading_trip_model.updateOne({ _id: ride_id }, { $addToSet: { calls: req.user.id } }).exec()
 
             return res.json({
                 'status': true,
             })
         }
 
 
         res.json({
             'status': false,
         })*/

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/food-call', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { restaurant_id } = req.body

        if (!restaurant_id) return next('Bad Request')

        const ad = await restaurant_model.findOne({ user_id: restaurant_id, is_active: true, is_approved: true }).select('user_id category_id')

        if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'المطعم غير موجود' : 'The restaurant not exist' })

        const subscriptions = await subscription_model.findOne({ sub_category_id: ad.category_id, $or: [{ user_id: req.user.id }, { user_id: ad.user_id }] })

        if (subscriptions) {

            startSubscriptionCounter(ad.category_id, req.user.id, language)
            startSubscriptionCounter(ad.category_id, ad.user_id, language)

            restaurant_model.findOne({ user_id: restaurant_id, calls: { $nin: req.user.id } }).select('user_id').then(isInCall => {
                if (isInCall) {
                    const cashBackRandom = Math.random() * 5

                    if (parseInt(cashBackRandom) == 3) {
                        restaurant_model.updateOne(
                            { _id: restaurant_id },
                            { $addToSet: { calls: req.user.id } },
                        ).exec()
                        callCashBack(req.user.id, language)
                    }
                }
            })
        }

        res.json({
            'status': subscriptions != null
        })

        /*const result = await restaurant_model.findOne({ user_id: restaurant_id, is_active: true, is_approved: true, calls: { $nin: [req.user.id] } }).select('user_id category_id')

        if (result) {

            startSubscriptionCounter(result.category_id, req.user.id, language)

            startSubscriptionCounter(result.category_id, result.user_id, language)

            restaurant_model.updateOne(
                { user_id: restaurant_id },
                { $addToSet: { calls: req.user.id } },
            ).exec()

            callCashBack(req.user.id, language)
        }

        res.json({
            'status': result != null,
        })*/


    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/health-call', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { doctor_id } = req.body

        if (!doctor_id) return next('Bad Request')

        const ad = await doctor_model.findOne({ user_id: doctor_id, is_active: true, is_approved: true }).select('user_id category_id')

        if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'الدكتور غير موجود' : 'The Doctor not exist' })

        const subscriptions = await subscription_model.findOne({ sub_category_id: ad.category_id, $or: [{ user_id: req.user.id }, { user_id: ad.user_id }] })

        if (subscriptions) {

            startSubscriptionCounter(ad.category_id, req.user.id, language)
            startSubscriptionCounter(ad.category_id, ad.user_id, language)

            doctor_model.findOne({ user_id: doctor_id, calls: { $nin: req.user.id } }).select('user_id').then(isInCall => {
                if (isInCall) {
                    const cashBackRandom = Math.random() * 5

                    if (parseInt(cashBackRandom) == 3) {
                        doctor_model.updateOne(
                            { _id: doctor_id },
                            { $addToSet: { calls: req.user.id } },
                        ).exec()
                        callCashBack(req.user.id, language)
                    }
                }
            })
        }

        res.json({
            'status': subscriptions != null
        })

        /* const result = await doctor_model.findOne({ user_id: doctor_id, is_active: true, is_approved: true, calls: { $nin: [req.user.id] } }).select('user_id category_id')
 
         if (result) {
 
             startSubscriptionCounter(result.category_id, req.user.id, language)
 
             startSubscriptionCounter(result.category_id, result.user_id, language)
 
             doctor_model.updateOne(
                 { user_id: doctor_id },
                 { $addToSet: { calls: req.user.id } },
             ).exec()
 
             callCashBack(req.user.id, language)
         }
 
         res.json({
             'status': result != null,
         })*/

    } catch (e) {
        console.log(e)
        next(e)
    }
})
//agap-asponfgasodgss-sdgsgestewf-sdvsdggsdgsd-gsdgsdgdswegsdg-gsdg-dsg-dsg-dsg-sd-g-sd
router.post('/any', verifyToken, async (req, res, next) => { // any
    try {

        const { language } = req.headers

        anyCashBack(req.user.id, language)

        res.json({
            'status': true,
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/five-years', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const result = await wallet_model.findOne({ user_id: req.user.id }).select('balance five_years months')

        if (!result) return next({ 'status': 404, 'message': language == 'ar' ? 'المستخدم غير موجود' : 'User not found' })

        if (result.months < 60) return next({ 'status': 400, 'message': language == 'ar' ? 'لم يمر 5 سنوات بعد' : '5 years have not passed yet' })

        if (result.five_years == 0) return next({ 'status': 400, 'message': language == 'ar' ? 'ليس لديك هدية لتحصل عليها' : 'You don\'t have a gift to get' })

        await wallet_model.updateOne({ user_id: req.user.id }, { five_years: null, $inc: { balance: result.five_years } })

        res.json({
            'status': true,
            'data': language == 'ar' ? 'تم التحويل بنجاح الي رصيدك' : 'Successfully transferred to your balance'
        })
    } catch (e) {
        next(e)
    }
})

router.get('/ten-years', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const result = await wallet_model.findOne({ user_id: req.user.id }).select('balance ten_years months')

        if (!result) return next({ 'status': 404, 'message': language == 'ar' ? 'المستخدم غير موجود' : 'User not found' })

        if (result.months < 120) return next({ 'status': 400, 'message': language == 'ar' ? 'لم يمر 10 سنوات بعد' : '10 years have not passed yet' })

        if (result.ten_years == 0) return next({ 'status': 400, 'message': language == 'ar' ? 'ليس لديك هدية لتحصل عليها' : 'You don\'t have a gift to get' })

        await wallet_model.updateOne({ user_id: req.user.id }, { ten_years: null, $inc: { balance: result.ten_years } })

        res.json({
            'status': true,
            'data': language == 'ar' ? 'تم التحويل بنجاح الي رصيدك' : 'Successfully transferred to your balance'
        })
    } catch (e) {
        next(e)
    }
})

export default router