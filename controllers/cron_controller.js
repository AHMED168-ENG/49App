import subscription_model from "../models/subscription_model.js"
import user_model from "../models/user_model.js"
import auth_model from "../models/auth_model.js"
import sub_category_model from "../models/sub_category_model.js"
import notification_model from "../models/notification_model.js"
import dynamic_ad_model from "../models/dynamic_ad_model.js"
import wallet_model from "../models/wallet_model.js"
import app_manager_model from '../models/app_manager_model.js';

import { sendNotifications, sendCashBackNotifications } from './notification_controller.js'
import rider_model from "../models/rider_model.js"
import { foodCategoryId, healthCategoryId } from "./ride_controller.js"
import restaurant_model from "../models/restaurant_model.js"
import doctor_model from "../models/doctor_model.js"
import { likeCashBack, shareCashBack, viewsCashBack } from "./cash_back_controller.js"
import app_radio_model from "../models/app_radio_model.js"
import axios from "axios"

export const runEvery12AM = async () => {

    try {

        // Loop Every Day (When 12 AM) Any User Has Ref Storage > 0 And Balance < 1000 Then Incremnt Balance Step Var And Decrement Ref Storage (Step Var) And Send Notification 
        // remove premium Subscriptions from socket if days equal 0


        await user_model.updateMany({ locked_days: { $gt: 0 } }, { $inc: { locked_days: -1 } }).exec()

        user_model.updateMany({ is_locked: true, locked_days: 0 }, { is_locked: false }).exec()

        await subscription_model.updateMany({ is_active: true, days: { $gt: 0 } }, { $inc: { days: -1 } })

        await app_radio_model.updateMany({ is_active: true, days: { $gt: 0 } }, { $inc: { days: -1 } })

        app_radio_model.updateMany({ is_active: true, days: 0 }, { is_active: false }).exec()

        restaurant_model.updateMany({}, { requests: [], calls: [] }).exec()
        doctor_model.updateMany({}, { requests: [], calls: [] }).exec()

        var count = 0

        while (count != -1) {

            const subscriptions = await subscription_model.find({
                is_active: true,
                days: 0,
            })
                .skip((count * 100))
                .limit(100)
                .select('sub_category_id user_id is_premium')

            console.log(`The Count ${subscriptions.length}`)

            for (var item of subscriptions) {

                try {

                    subscription_model.deleteOne({ _id: item.id }).exec()

                    const subCategory = await sub_category_model.findById(item.sub_category_id).select('name_ar name_en parent')


                    if (item.is_premium == true) {
                        if (subCategory.parent == foodCategoryId) {

                            restaurant_model.updateOne({ user_id: item.user_id, is_premium: true }, { is_premium: false }).exec()

                        } else if (subCategory.parent == healthCategoryId) {

                            doctor_model.updateOne({ user_id: item.user_id, is_premium: true }, { is_premium: false }).exec()

                        } else {
                            dynamic_ad_model.updateMany({ user_id: item.user_id, sub_category_id: item.sub_category_id, is_premium: true }, { is_premium: false }).exec()
                        }
                    }

                    const user = await user_model.findById(item.user_id).select('_id language')
                    const fcm = await auth_model.find({ user_id: item.user_id }).select('fcm').distinct('fcm')

                    const titleAr = 'لقد انتهى الإشتراك'
                    const titleEn = 'Subscription has expired'
                    const subCategoryName = user.language == 'ar' ? subCategory.name_ar : subCategory.name_en

                    const bodyAr = `لقد انتهى اشتراكك في ${subCategoryName} اذا كنت تريد مواصلة استخدامك للميزات المدفوعة جدد الان`
                    const bodyEn = `Your subscription to ${subCategoryName} has expired, if you want to continue using the paid features, renew now`

                    const notification = new notification_model({
                        receiver_id: item.user_id,
                        tab: 3,
                        text_ar: bodyAr,
                        text_en: bodyEn,
                        type: 1005,
                        direction: item.sub_category_id
                    })

                    await notification.save()

                    if (fcm && user) {
                        sendNotifications(
                            fcm,
                            user.language == 'ar' ? titleAr : titleEn,
                            user.language == 'ar' ? bodyAr : bodyEn,
                            1005,
                            item.sub_category_id,
                        )
                    }

                    try {

                        axios.post(process.env.REAL_TIME_SERVER_URL + 'set-chat-disabled',
                            {
                                user_id: item.user_id,
                                category_id: item.sub_category_id,
                            },
                            {
                                headers:
                                {
                                    'Key': process.env.REAL_TIME_SERVER_KEY
                                },
                            },
                        )
                    } catch (e) { }

                } catch (_) { }
            }
            if (subscriptions.length == 100) count++
            else count = -1
        }

        count = 0
        while (count != -1) {
            const riders = await rider_model.find({
                free_ride: true,
                is_approved: true,
            }).skip((count * 100))
                .limit(100)
                .select('_id category_id')

            for (const rider of riders) {
                try {
                    sub_category_model.findById(rider.category_id).select('daily_price').then(subCategory => {
                        rider_model.updateOne({
                            free_ride: false,
                            $inc: {
                                indebtedness: subCategory.daily_price,
                            }
                        }).exec()
                    })
                } catch (_) { }
            }
            if (riders.length == 100) count++
            else count = -1
        }

        count = 0
        while (count != -1) {
            const users = await user_model.find({}).skip((count * 100))
                .limit(100)
                .select('_id language')

            for (const user of users) {
                await likeCashBack(user.id, user.language)
                await shareCashBack(user.id, user.language)
                await viewsCashBack(user.id, user.language)
            }
            if (users.length == 100) count++
            else count = -1
        }
    } catch (e) {
        console.log(e)
    }
}

export const checkUsersBalanceStorage = async () => {

    try {
        var count = 0
        const appManager = await app_manager_model.findOne({}).select('step_value')

        while (count > -1) {
            const wallets = await wallet_model.find({ referral_storage: { $gt: 0 }, balance: { $lt: 1000 } }).skip((count * 100)).limit(100)

            for (const wallet of wallets) {

                wallet_model.updateOne({ _id: wallet.id }, { $inc: { referral_storage: -appManager.step_value, balance: appManager.step_value, total_cash_back: appManager.step_value } }).exec()

                Promise.all([user_model.findById(wallet.user_id).select('language'),
                auth_model.find({ user_id: wallet.user_id }).select('fcm').distinct('fcm')]
                ).then(r => {
                    if (r[0] && r[1]) {
                        sendCashBackNotifications(
                            wallet.user_id, r[1],
                            appManager.step_value,
                            r[0].language
                        )
                    }
                })
            }

            if (wallets.length == 100) count++
            else count = -1
        }
    } catch (e) {
        console.log(e)
    }
}

export const calcFiveAndTenYears = async () => {

    try {
        const appManager = await app_manager_model.findOne({}).select('interest')

        var count = 0

        while (count != -1) {

            const wallets = await wallet_model.find({ months: { $lt: 120 } }).skip((count * 1000)).limit(1000).select('user_id monthly_balance total months')

            for (const wallet of wallets) {

                const startBalance = wallet.monthly_balance / 10

                const profit = ((wallet.total * appManager.interest) / 100) / 12

                const total = startBalance + profit

                wallet_model.updateOne({ _id: wallet.id }, { monthly_balance: 0, $inc: { total } }).exec()

                if (wallet.months == 59) {
                    wallet_model.updateOne({ _id: wallet.id }, { five_years: wallet.total + total }).exec()
                }

                else if (wallet.months == 119) {
                    wallet_model.updateOne({ _id: wallet.id }, { ten_years: wallet.total + total }).exec()
                }
            }
            if (wallets.length == 1000) count++
            else count = -1
        }
        wallet_model.updateMany({}, { $inc: { months: 1 } }).exec()
    } catch (e) {
        console.log()
    }
}