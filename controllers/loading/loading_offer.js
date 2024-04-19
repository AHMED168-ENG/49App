import asyncWrapper from "../../utils/asyncWrapper.js";
import loading_model from '../../models/loading_model.js';
import user_model from '../../models/user_model.js'
import sub_category_model from '../../models/sub_category_model.js'
import notification_model from '../../models/notification_model.js'
import auth_model from '../../models/auth_model.js'
import loading_trip_model from '../../models/loading_trip_model.js';
import rating_model from '../../models/rating_model.js';
import { loadingCategoryId } from '../../controllers/ride_controller.js';
import { sendNotifications } from '../../controllers/notification_controller.js';
import { requestCashBack } from '../../controllers/cash_back_controller.js';



// ad : its advertisement id 
// loading_model : model store on it rider about loading

/** ------------------------------------------------------  
 * @desc rider get loading tripe by id
 * @route /get-loading-trips
 * @method get
 * @returns {status , data}
 * @warning : model loading_trip_model do not have sub_category_name
 * @warning : model loading_trip_model do not have rating
 * @warning : model rating_model do not have ad_id
 /**  ------------------------------------------------------  */
export const getLoadingTrip = asyncWrapper(async (req, res, next) => {
    const { page } = req.query;
    // get all loading trip for rider using rider_id   
    const result = await loading_trip_model.find({ rider_id: req.user.id, is_completed: true })
        .sort({ createdAt: -1, _id: 1 })
        .skip((((page ?? 1) - 1) * 20))
        .limit(20);

    // get rating for each trip 
    const ratings = await rating_model.find({ user_id: req.user.id, ad_id: { $in: result.map(e => e.id) } });
    // Iterate through each loading trip and add ratings
    for (const ride of result) {
        console.log("here" , ride);
        ride._doc.sub_category_name = ''; // Initialize sub_category_name property to an empty string

        // Iterate through each rating to find matching ad_id
        for (const rating of ratings) {
            console.log("here" , rating.ad_id,  ride.id);
            if (rating.ad_id == ride.id){
                ride._doc.rating = rating; 
                break; 
            }
        }
    }
    // Send response with status and data
    res.json({ 'status': true, 'data': result });
});

/** ------------------------------------------------------  
 * @desc make request for loading
 * @route /new-loading-request
 * @method post
 * @returns {status}
 /**  ------------------------------------------------------  */
export const makeRequestForLoading = asyncWrapper( async (req, res, next) => {
        const { language } = req.headers

        const { category_id, receipt_point, delivery_point, desc, price, time, phone } = req.body

        const [user, category] = await Promise.all([
            // get user whose request for loading and category
            user_model.findById(req.user.id).select('country_code'),
            sub_category_model.findById(category_id).select('name_ar name_en')
        ]);
    
        if (!user) return next({ status: 404, message: language === 'ar' ? 'لم يتم العثور على المستخدم' : 'The User is not Exist' });
        if (!category) return next({ status: 404, message: language === 'ar' ? 'لم يتم العثور على القسم' : 'The Category is not Exist' });
    
        // create loading trip using user_id and category after checking
        const loadingTrip = await loading_trip_model.create({
            user_id: req.user.id,
            category_id,
            receipt_point,
            delivery_point,
            desc,
            price,
            time,
        });
        console.log("first",loadingTrip);
        //  cashback  logic for request loading 
        requestCashBack(req.user.id, language)
        // get riders from loading model
        const riders = await loading_model.find({
            is_active: true,
            is_approved: true,
            country_code: user.country_code,
            category_id,
            user_id: { $ne: req.user.id }
        }).limit(100).select('user_id');
        console.log("second",riders);

        const MessageUserRequestEn = `${category.name_en} Loading from ${receipt_point} to ${delivery_point} , Description ${desc}, Date ${time}, price offer ${price}`
        const MessageUserRequestAr = `تحميلة ${category.name_ar} من ${receipt_point} الى ${delivery_point}, الوصف ${desc}, الميعاد ${time}, عرض سعر ${price}`
        // process notifications with riders
        const notificationObjects = riders.map(rider => ({
            receiver_id: rider.user_id,
            user_id: req.user.id,
            sub_category_id: category_id,
            tab: 2,
            text_ar: MessageUserRequestAr,
            text_en: MessageUserRequestEn,
            direction: loadingTrip.id,
            main_category_id: loadingCategoryId,
            type: 10004,
            phone,
        }));
        console.log("third",notificationObjects);
        // Save notifications in one process using insertMany
        const notification = await notification_model.insertMany(notificationObjects);
        console.log("fourth",notification);
        // Send notifications asynchronously
        await Promise.all(riders.map(async rider => {
            const [user, fcmTokens] = await Promise.all([
                // get language for rider 
                user_model.findById(rider.user_id).select('language'),
                //and get fcm for notification in mobile 
                auth_model.find({ 'user_id': rider.user_id }).distinct('fcm')
            ]);
            const [title, body] = user.language === 'ar' ? ['طلب جديد', notificationObjects[0].text_ar] : ['New Request', notificationObjects[0].text_en];
            console.log("fifth",title, body);
            sendNotifications(fcmTokens, title, body, 10004);
        }));
        res.json({
            'status': true,
        })
})

/** ------------------------------------------------------  
 * @desc send loading offer
 * @route /send-loading-offer
 * @method post
 * @returns {status}
 * @desc adId is advertisement id
 /**  ------------------------------------------------------  */
export const sendLoadingOffer = asyncWrapper( async (req, res, next) => {
        const { language } = req.headers
        const { adId, price } = req.body

        const [user, ad]= await Promise.all([
            //get rider info
             user_model.findById(req.user.id).select('first_name profile_picture'),
            // get advertisement data
             loading_trip_model.findOne({ _id: adId, is_completed: false })
        ])
        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على السمتخدم' : 'The User is not Exist' })
        if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الاعلان' : 'The Ad is not Exist' })

        // check if rider exit in loading_model
        const rider = await loading_model.findOne({ user_id: req.user.id, is_approved: true, is_active: true, category_id: ad.category_id })

        if (!rider) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على البيانات' : 'The Data is not Exist' })

        const NewOfferMessageEN = `New Offer (${ad.delivery_point}), From ${user.first_name}, price offer ${price}, rating ${rider.rating}`
        const NewOfferMessageAr = `عرض جديد ${ad.delivery_point} ,من ${user.first_name},عرض السعر ${price}, التقييم ${rider.rating}`

        // create notification model
        const notificationObject = await  notification_model.create({
            receiver_id: ad.user_id,
            user_id: req.user.id,
            sub_category_id: ad.category_id,
            tab: 2,
            text_ar: NewOfferMessageAr,
            text_en: NewOfferMessageEN,
            direction: ad.id,
            main_category_id: loadingCategoryId,
            type: 10005,
            attachment: user.profile_picture,
            ad_owner: ad.user_id,
            request_price: price,
            phone: rider.phone,
        })
        console.log("first" , notificationObject);

        // send notification for user who send request loading
        const [adUser, fcmTokens] = await Promise.all([
            user_model.findById(ad.user_id).select('language'),
            auth_model.find({ 'user_id': ad.user_id }).distinct('fcm')
        ]);

        console.log("second",adUser, fcmTokens);
        // Send notifications 
        sendNotifications(fcmTokens, adUser.language === 'ar' ? 'عرض سعر جديد' : 'New Offer', adUser.language === 'ar' ? NewOfferMessageAr : NewOfferMessageEN, 10005);
        res.json({ 'status': true })
})

export const acceptLoadingOffer = asyncWrapper(async (req, res, next) => {
        const { language } = req.headers

        const { adId, notificationId } = req.body
        console.log("here");
        const ad = await loading_trip_model.findOne({ _id: adId, user_id: req.user.id })

        if (!ad) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الاعلان' : 'The Ad is not Exist' })

        if (ad.is_completed == true) return next({ 'status': 400, 'message': language == 'ar' ? 'الاعلان بالفعل مزود بمقدم خدمة' : 'The Ad is Already has service provider' })

        const notification = await notification_model.findOne({ _id: notificationId, receiver_id: req.user.id })

        if (!notification) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على العرض' : 'The Offer is not Exist' })

        const user = await user_model.findById(notification.user_id).select('_id language')

        if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على المستخدم' : 'The User is not Exist' })

        loading_trip_model.updateOne({ _id: ad.id }, { rider_id: user.id, is_completed: true, price: notification.request_price }).exec()

        loading_model.updateOne({ user_id: user.id }, { $inc: { profit: notification.request_price, trips: 1 } }).exec()


        const titleAr = 'تم قبول عرض السعر'
        const titleEn = 'The Price Offer Accepted'
        const bodyEn = `Price Offer ${notification.request_price} for Loading ${ad.delivery_point} is Accepted, you can contact the customer now `
        const bodyAr = `تم قبول عرض السعر ${notification.request_price} مقابل لرحلة ${ad.delivery_point} ، يمكنك الاتصال بالعميل الآن`

        await notification_model.deleteMany({ direction: ad.id }).exec()

        const notificationObject = new notification_model({
            receiver_id: user.id,
            user_id: req.user.id,
            sub_category_id: ad.category_id,
            tab: 2,
            text_ar: bodyAr,
            text_en: bodyEn,
            direction: ad.id,
            type: 10006,
            ad_owner: req.user.id,
            main_category_id: loadingCategoryId,

            is_accepted: true,
        })

        notificationObject.save()


        auth_model.find({ 'user_id': user.id }).distinct('fcm').then(
            fcm => sendNotifications(fcm, user.language == 'ar' ? titleAr : titleEn, user.language == 'ar' ? bodyAr : bodyEn, 10006))

        res.json({ 'status': true })
})

export const deleteLoadingRequest = asyncWrapper( async (req, res, next) => {
        const { language } = req.headers

        const result = await loading_trip_model.findOneAndDelete({ _id: req.params.requestId, user_id: req.user.id, })

        if (!result) return next({ 'status': 404, 'message': language == 'ar' ? 'لم يتم العثور على الطلب' : 'The Request is not Exist' })

        if (result) {
            notification_model.deleteMany({
                direction: req.params.requestId,
            }).exec()
        }
        res.json({
            'status': true,
        })
})

export const getAllUserLoading = asyncWrapper(async (req, res, next) => {
        const { language } = req.headers

        const { page } = req.query

        const result = await loading_trip_model.find({ user_id: req.user.id, is_completed: true }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 20)).limit(20)

        const riderIds = []
        const subCategoriesIds = []

        for (const ride of result) {
            if (!riderIds.includes(ride.rider_id))
                riderIds.push(ride.rider_id)
            if (!subCategoriesIds.includes(ride.category_id))
                subCategoriesIds.push(ride.category_id)
        }

        if (riderIds.length > 0) {

            const riders = await loading_model.find({ user_id: { $in: riderIds } })
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
})


