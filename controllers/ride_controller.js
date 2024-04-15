import rider_model from '../models/rider_model.js'
import ride_model from '../models/ride_model.js'
import user_model from '../models/user_model.js'
import notification_model from '../models/notification_model.js'
import auth_model from '../models/auth_model.js'
import subscription_model from '../models/subscription_model.js'
import axios from 'axios';

import { sendNotifications } from '../controllers/notification_controller.js'
import app_manager_model from '../models/app_manager_model.js'
import mongoose from 'mongoose'

export const taxiCategoryId = '62c8ba9e8e28a58a3edf57e9'
export const captainCategoryId = '62c8ba9f8e28a58a3edf57eb'
export const scooterCategoryId = '62c8baac8e28a58a3edf5803'
export const womenOnlyCategoryId = '62ea012a69ea29c91dfc3917'
export const comeWithYouCategoryId = '62ea00e269ea29c91dfc390c';
export const pickMeCategoryId = '62ea008d69ea29c91dfc3908';

export const rideCategoryId = '62c8b5779332225799fe3304';
export const loadingCategoryId = '62c8b5779332225799fe3302';
export const foodCategoryId = '62c8b57e9332225799fe3308';
export const healthCategoryId = '62c8b57c9332225799fe3306';

export const appRadioCategoryId = '62fe5a9b67834d48be806da2';
export const profileViewCategoryId = '62ef7cf658c90d4a7ed48120';


export async function createOtherRequest(userId, country_code, mainCategoryId, cateogryNameAr, cateogryNameEn, category_id, from, to, distance, time, lat, lng, destination_lat, destination_lng, price, passengers, phone, language, air_conditioner, car_model_year , auto_accept) {
    try {

        var titleAr = 'طلب جديد'
        var titleEn = 'New Request'
        var bodyEn = `${cateogryNameEn} ride from ${from} to ${to} , distance ${distance}, duration ${time}, passengers ${passengers}, price offer ${price}`
        var bodyAr = `رحلة ${cateogryNameAr} من ${from} الى ${to}, مسافة ${distance}, مدة ${time}, ركاب ${passengers}, عرض سعر ${price}`

        const object = new ride_model(
            {
                category_id,
                location : {
                    type : "Point",
                    coordinates : [parseFloat(destination_lat),parseFloat(destination_lng)]
                },
                distance,
                to, from,
                passengers,
                user_id: userId,
                time,
                user_lat: lat,
                user_lng: lng,
                price: price,
                phone,
                auto_accept
            }
        )

        const ride = await object.save()

        if (isTaxiOrCaptainOrScooter(category_id)) {
            const is_premium = (await subscription_model.findOne({ user_id: userId, sub_category_id: category_id, is_premium: true, is_active: true, })) != null
            axios.post(process.env.REAL_TIME_SERVER_URL + 'new-ride-request',
                {
                    user_id: userId,
                    language,
                    category_id,
                    is_premium,
                    from,
                    to,
                    distance,
                    time,
                    lat,
                    lng,
                    destination_lat,
                    destination_lng,
                    price,
                    phone,
                    air_conditioner,
                    car_model_year,
                    direction_id: ride.id,
                },
                {
                    headers:
                    {
                        'Key': process.env.REAL_TIME_SERVER_KEY
                    },
                },
            )

        } else {
            var count = 0
            while (count != -1) {

                const riders = await rider_model.find({
                    is_active: true,
                    is_approved: true,
                    country_code,
                    category_id
                }).skip((count * 100)).limit(100).select('user_id')

                for (const rider of riders) {

                    const notificationObject = new notification_model({
                        receiver_id: rider.user_id,
                        user_id: userId,
                        sub_category_id: category_id,
                        tab: 2,
                        text_ar: bodyAr,
                        text_en: bodyEn,
                        direction: ride.id,
                        main_category_id: mainCategoryId,
                        ad_owner: userId,
                        type: 10001,
                    })

                    notificationObject.save()

                    Promise.all([
                        user_model.findById(rider.user_id).select('language'),
                        auth_model.find({ 'user_id': rider.user_id }).distinct('fcm'),
                    ]
                    ).then(r => {
                        const user = r[0]
                        const fcm = r[1]
                        sendNotifications(fcm, user.language == 'ar' ? titleAr : titleEn, user.language == 'ar' ? bodyAr : bodyEn, 10001)
                    })
                }

                if (riders.length == 100) count++
                else count = -1
            }
        }
        return ride
    } catch (e) {

        console.log(e)
    }
}

export const isTaxiOrCaptainOrScooter = (categoryId) =>
    categoryId == taxiCategoryId ||
    categoryId == captainCategoryId ||
    categoryId == scooterCategoryId ||
    categoryId == womenOnlyCategoryId;
