import rider_model from '../models/rider_model.js'
import ride_model from '../models/ride_model.js'
import user_model from '../models/user_model.js'
import notification_model from '../models/notification_model.js'
import auth_model from '../models/auth_model.js'

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


export async function createOtherRequest(userId, country_code, mainCategoryId, cateogryNameAr, cateogryNameEn, category_id, from, to, distance, time, lat, lng, destination_lat, destination_lng, price, passengers, phone, language, air_conditioner, car_model_year) {
    try {
        
        var titleAr = 'طلب جديد'
        var titleEn = 'New Request'
        var bodyEn = `${cateogryNameEn} ride from ${from} to ${to} , distance ${distance}, duration ${time}, passengers ${passengers}, price offer ${price}`
        var bodyAr = `رحلة ${cateogryNameAr} من ${from} الى ${to}, مسافة ${distance}, مدة ${time}, ركاب ${passengers}, عرض سعر ${price}`

        const info = await app_manager_model.findOne({}).select('ride_area_distance')
        const riders = await rider_model.aggregate([
            {
              $geoNear: {
                near: {
                  type: 'Point',
                  coordinates: [parseFloat(lng), parseFloat(lat)]
                },
                distanceField: 'location',
                spherical: true,
                maxDistance: info.ride_area_distance ?? process.env.maxDistance // 5 km in meters
              }
            },
            {
                $match : {
                    is_active: true,
                    is_approved: true,
                    // country_code,
                    is_ready : true,
                    category_id : mongoose.Types.ObjectId(category_id),
                    airـconditioner : air_conditioner || false,
                    car_model_year : car_model_year
                }
            }
          ]);
         for(let x = 0 ; x < riders.length ; x++) {
            const object = new ride_model(
                {
                    category_id,
                    destination_lat,
                    destination_lng,
                    distance,
                    to, from,
                    passengers,
                    user_id: userId,
                    time,
                    user_lat: lat,
                    user_lng: lng,
                    price: price,
                    phone,
                    rider_id : riders[x].id
                }
            )
            const ride = await object.save()
            const notificationObject = new notification_model({
                receiver_id: ride.user_id,
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
                user_model.findById(ride.user_id).select('language'),
                auth_model.find({ 'user_id': ride.user_id }).distinct('fcm'),
            ]
            ).then(r => {
                const user = r[0]
                const fcm = r[1] 
                sendNotifications(fcm, user.language == 'ar' ? titleAr : titleEn, user.language == 'ar' ? bodyAr : bodyEn, 10001)
            })
         }

    } catch (e) {
        console.log(e)
    }
}

export const isTaxiOrCaptainOrScooter = (categoryId) =>
    categoryId == taxiCategoryId ||
    categoryId == captainCategoryId ||
    categoryId == scooterCategoryId ||
    categoryId == womenOnlyCategoryId;
