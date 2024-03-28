import app_manager_model from '../models/app_manager_model.js'
import wallet_model from '../models/wallet_model.js'
import user_model from '../models/user_model.js'
import auth_model from '../models/auth_model.js'
import notification_model from '../models/notification_model.js'

import { sendCashBackNotifications, sendRefCashBackNotifications, sendNotifications } from '../controllers/notification_controller.js'


export const requestCashBack = async (userId, language) => {

    try {
        const user = await user_model.findById(userId).select('_id referral_id first_name last_name')

        const wallet = await wallet_model.findOne({ user_id: userId })

        const fcm = await auth_model.find({ user_id: userId }).distinct('fcm')

        const appManager = await app_manager_model.findOne({})

        if (!user || !wallet || !fcm || !appManager) return

        const now = new Date()
        const todayDate = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`

        if (wallet.last_gift == todayDate && wallet.today_gift >= appManager.max_day_gift) return // check  

        if (wallet.last_gift != todayDate) await wallet_model.updateOne({ _id: wallet.id }, { today_gift: 0, last_gift: todayDate }) // 

        if (wallet.balance > 1000 && wallet.free_click_storage > 0) {
            await wallet_model.updateOne({ _id: wallet._id }, { free_click_storage: 0, $inc: { referral_storage: wallet.free_click_storage } })
        }

        if (wallet.refund_storage >= 0 ) {

            if (wallet.provider_cash_back >= appManager.step_value) {
                wallet_model.updateOne({ _id: wallet.id }, { last_gift: todayDate, $inc: { provider_cash_back: -appManager.step_value, balance: appManager.step_value, total_cash_back: appManager.step_value, today_gift: appManager.step_value } }).exec()

                console.log('here 5')
                if (fcm) {
                    console.log('here 6')
                    sendCashBackNotifications(
                        user.id,
                        fcm,
                        appManager.step_value,
                        language
                    )
                }
            }
            else if (wallet.provider_cash_back < appManager.step_value && appManager.request_storage >= appManager.step_value) {

                console.log('here 7')
                app_manager_model.updateOne({ _id: appManager.id }, { $inc: { request_storage: - appManager.step_value } }).exec()
                wallet_model.updateOne({ _id: wallet._id }, { last_gift: todayDate, $inc: { balance: appManager.step_value, total_cash_back: appManager.step_value, today_gift: appManager.step_value } }).exec()

                if (fcm) {
                    console.log('here 8')
                    sendCashBackNotifications(
                        user.id,
                        fcm,
                        appManager.step_value,
                        language
                    )
                }
            }

        } else {

            console.log('here 9')
            if (wallet.provider_cash_back >= appManager.step_value) { // #
                wallet_model.updateOne({ _id: wallet.id }, { $inc: { provider_cash_back: -appManager.step_value, refund_storage: appManager.step_value } }).exec()

                console.log('here 10')

            } else if (wallet.provider_cash_back > 0 && wallet.provider_cash_back < appManager.step_value) { // #
                wallet_model.updateOne({ _id: wallet.id }, { provider_cash_back: 0, $inc: { refund_storage: wallet.provider_cash_back } }).exec()

                console.log('here 11')

            } else if (wallet.provider_cash_back == 0 && appManager.request_storage >= appManager.step_value) { // #

                app_manager_model.updateOne({ _id: appManager.id }, { $inc: { request_storage: - appManager.step_value } }).exec()
                wallet_model.updateOne({ _id: wallet.id }, { $inc: { refund_storage: appManager.step_value } }).exec()

                console.log('here 12')
            } else if (wallet.provider_cash_back == 0 && appManager.request_storage > 0 && appManager.request_storage < appManager.step_value) {  // #

                app_manager_model.updateOne({ _id: appManager.id }, { request_storage: 0 }).exec()
                wallet_model.updateOne({ _id: wallet.id }, { $inc: { refund_storage: appManager.request_storage } }).exec()

                console.log('here 13')

            } else if (wallet.provider_cash_back == 0 && appManager.request_storage == 0) {

                console.log('here 14')

                if (wallet.referral_cash_back > 0 && wallet.free_click_storage > 0) {
                    const referralWallet = await wallet_model.findOne({ user_id: user.referral_id })

                    if (referralWallet) {

                        wallet_model.updateOne({ _id: wallet.id }, { $inc: { free_click_storage: -appManager.step_value, refund_storage: -appManager.step_value, referral_cash_back: -appManager.step_value } }).exec()


                        const refUser = await user_model.findById(referralWallet.user_id).select('language')
                        const refFcm = await auth_model.find({ user_id: referralWallet.user_id }).select('fcm').distinct('fcm')

                        if (referralWallet.balance < 1000 && referralWallet.today_gift < appManager.max_day_gift) {

                            wallet_model.updateOne({ _id: referralWallet.id }, { last_gift: todayDate, $inc: { balance: appManager.step_value, total_cash_back: appManager.step_value, today_gift: appManager.step_value } }).exec()

                            if (refFcm && refUser) {
                                sendRefCashBackNotifications(
                                    referralWallet.user_id,
                                    refFcm,
                                    `${user.first_name} ${user.last_name}`,
                                    appManager.step_value,
                                    refUser.language
                                )
                            }

                        } else {

                            wallet_model.updateOne({ _id: referralWallet.id }, { $inc: { referral_storage: appManager.step_value } }).exec()

                            const arTitle = `استرداد نقدي 49`
                            const enTitlle = `49 Cash Back`
                            const name = `${user.first_name} ${user.last_name}`

                            const arBody = `لقد قام ${name} باستخدام التطبيق وسوف تحصل على ${appManager.step_value} خلال الايام القادمة`
                            const enBody = `${name} has used the App and you will get ${appManager.step_value} within the next few days`


                            sendNotifications(refFcm, refUser.language == 'ar' ? arTitle : enTitlle, '')
                            const object = new notification_model({
                                receiver_id: referralWallet.user_id,
                                tab: 3,
                                type: 1000,
                                text_ar: arBody,
                                text_en: enBody,
                            })

                            object.save()

                        }
                    }
                } else if (wallet.referral_cash_back == 0 && wallet.free_click_storage > 0 && wallet.balance < 1000) {
                    wallet_model.updateOne({ _id: wallet.id }, { last_gift: todayDate, $inc: { free_click_storage: -appManager.step_value, refund_storage: -appManager.step_value, balance: appManager.step_value, total_cash_back: appManager.step_value, today_gift: appManager.step_value } }).exec()

                    console.log('here 15')
                    if (fcm) {

                        sendCashBackNotifications(
                            user.id,
                            fcm,
                            appManager.step_value,
                            language
                        )
                    }
                }
            }
        }
    } catch (e) {
        console.log(e)
    }
}

export const callCashBack = async (userId, language) => {

    const user = await user_model.findById(userId).select('_d referral_id first_name last_name')

    const wallet = await wallet_model.findOne({ user_id: userId })

    const fcm = await auth_model.find({ user_id: userId }).select('fcm').distinct('fcm')

    const appManager = await app_manager_model.findOne({})

    if (!user || !wallet || !fcm || !appManager) return

    const now = new Date()
    const todayDate = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`

    if (wallet.last_gift == todayDate && wallet.today_gift >= appManager.max_day_gift) return

    if (wallet.last_gift != todayDate) await wallet_model.updateOne({ _id: wallet.id }, { today_gift: 0, last_gift: todayDate })

    if (wallet.balance > 1000 && wallet.free_click_storage > 0) {
        await wallet_model.updateOne({ _id: wallet._id }, { free_click_storage: 0, $inc: { referral_storage: wallet.free_click_storage } })
    }

    if (wallet.refund_storage >= 0) {

        if (wallet.provider_cash_back >= appManager.step_value) {
            wallet_model.updateOne({ _id: wallet.id }, { last_gift: todayDate, $inc: { provider_cash_back: -appManager.step_value, balance: appManager.step_value, total_cash_back: appManager.step_value, today_gift: appManager.step_value } }).exec()

            if (fcm) {
                sendCashBackNotifications(
                    user.id,
                    fcm,
                    appManager.step_value,
                    language
                )
            }
        }
        else if (wallet.provider_cash_back < appManager.step_value && appManager.call_storage >= appManager.step_value) {

            app_manager_model.updateOne({ _id: appManager.id }, { $inc: { call_storage: - appManager.step_value } }).exec()
            wallet_model.updateOne({ _id: wallet._id }, { last_gift: todayDate, $inc: { balance: appManager.step_value, total_cash_back: appManager.step_value, today_gift: appManager.step_value } }).exec()

            if (fcm) {
                sendCashBackNotifications(
                    user.id,
                    fcm,
                    appManager.step_value,
                    language
                )
            }
        }

    } else {

        if (wallet.provider_cash_back >= appManager.step_value) { // #
            wallet_model.updateOne({ _id: wallet.id }, { $inc: { provider_cash_back: -appManager.step_value, refund_storage: appManager.step_value } }).exec()

        } else if (wallet.provider_cash_back > 0 && wallet.provider_cash_back < appManager.step_value) { // #
            wallet_model.updateOne({ _id: wallet.id }, { provider_cash_back: 0, $inc: { refund_storage: wallet.provider_cash_back } }).exec()

        } else if (wallet.provider_cash_back == 0 && appManager.call_storage >= appManager.step_value) { // #
            app_manager_model.updateOne({ _id: appManager.id }, { $inc: { call_storage: - appManager.step_value } }).exec()
            wallet_model.updateOne({ _id: wallet.id }, { $inc: { refund_storage: appManager.step_value } }).exec()

        } else if (wallet.provider_cash_back == 0 && appManager.call_storage > 0 && appManager.call_storage < appManager.step_value) {  // #
            app_manager_model.updateOne({ _id: appManager.id }, { call_storage: 0 }).exec()
            wallet_model.updateOne({ _id: wallet.id }, { $inc: { refund_storage: appManager.call_storage } }).exec()

        } else if (wallet.provider_cash_back == 0 && appManager.call_storage == 0) {

            if (wallet.referral_cash_back > 0 && wallet.free_click_storage > 0) {
                const referralWallet = await wallet_model.findOne({ user_id: user.referral_id })

                if (referralWallet) {

                    wallet_model.updateOne({ _id: wallet.id }, { $inc: { free_click_storage: -appManager.step_value, refund_storage: -appManager.step_value, referral_cash_back: -appManager.step_value } }).exec()

                    const refUser = await user_model.findById(referralWallet.user_id).select('language')
                    const refFcm = await auth_model.find({ user_id: referralWallet.user_id }).select('fcm').distinct('fcm')

                    if (referralWallet.balance < 1000 && referralWallet.today_gift < appManager.max_day_gift) {

                        wallet_model.updateOne({ _id: referralWallet.id }, { last_gift: todayDate, $inc: { balance: appManager.step_value, total_cash_back: appManager.step_value, today_gift: appManager.step_value } }).exec()

                        if (refFcm && refUser) {
                            sendRefCashBackNotifications(
                                referralWallet.user_id,
                                refFcm,
                                `${user.first_name} ${user.last_name}`,
                                appManager.step_value,
                                refUser.language
                            )
                        }

                    } else {

                        wallet_model.updateOne({ _id: referralWallet.id }, { $inc: { referral_storage: appManager.step_value } }).exec()

                        const arTitle = `استرداد نقدي 49`
                        const enTitlle = `49 Cash Back`
                        const name = `${user.first_name} ${user.last_name}`

                        const arBody = `لقد قام ${name} باستخدام التطبيق وسوف تحصل على ${appManager.step_value} خلال الايام القادمة`
                        const enBody = `${name} has used the App and you will get ${appManager.step_value} within the next few days`


                        sendNotifications(refFcm, refUser.language == 'ar' ? arTitle : enTitlle, '')
                        const object = new notification_model({
                            receiver_id: referralWallet.user_id,
                            tab: 3,
                            type: 1000,
                            text_ar: arBody,
                            text_en: enBody,
                        })

                        object.save()

                    }
                }
            } else if (wallet.referral_cash_back == 0 && wallet.free_click_storage > 0 && wallet.balance < 1000) {
                wallet_model.updateOne({ _id: wallet.id }, { last_gift: todayDate, $inc: { free_click_storage: -appManager.step_value, refund_storage: -appManager.step_value, balance: appManager.step_value, total_cash_back: appManager.step_value, today_gift: appManager.step_value } }).exec()

                if (fcm) {

                    sendCashBackNotifications(
                        user.id,
                        fcm,
                        appManager.step_value,
                        language
                    )
                }
            }
        }
    }
}

export const anyCashBack = async (userId, language) => {

    const user = await user_model.findById(userId).select('_d referral_id first_name last_name')

    console.log(`${user.first_name.trim()} ${user.last_name.trim()} try to get cashback`)

    const wallet = await wallet_model.findOne({ user_id: userId })

    const fcm = await auth_model.find({ user_id: userId }).select('fcm').distinct('fcm')

    const appManager = await app_manager_model.findOne({})

    if (!user || !wallet || !fcm || !appManager) return

    const now = new Date()
    const todayDate = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`

    if (wallet.last_gift == todayDate && wallet.today_gift >= appManager.max_day_gift) return

    if (wallet.last_gift != todayDate) await wallet_model.updateOne({ _id: wallet.id }, { today_gift: 0, last_gift: todayDate })

    if (wallet.balance > 1000 && wallet.free_click_storage > 0) {
        await wallet_model.updateOne({ _id: wallet._id }, { free_click_storage: 0, $inc: { referral_storage: wallet.free_click_storage } })
    }

    if (wallet.refund_storage >= 0) {

        if (wallet.provider_cash_back >= appManager.step_value) {
            wallet_model.updateOne({ _id: wallet.id }, { last_gift: todayDate, $inc: { provider_cash_back: -appManager.step_value, balance: appManager.step_value, total_cash_back: appManager.step_value, today_gift: appManager.step_value } }).exec()

            if (fcm) {
                sendCashBackNotifications(
                    user.id,
                    fcm,
                    appManager.step_value,
                    language
                )
            }
        }
        else if (wallet.provider_cash_back < appManager.step_value && appManager.any_storage >= appManager.step_value) {

            app_manager_model.updateOne({ _id: appManager.id }, { $inc: { any_storage: - appManager.step_value } }).exec()
            wallet_model.updateOne({ _id: wallet._id }, { last_gift: todayDate, $inc: { balance: appManager.step_value, total_cash_back: appManager.step_value, today_gift: appManager.step_value } }).exec()

            if (fcm) {
                sendCashBackNotifications(
                    user.id,
                    fcm,
                    appManager.step_value,
                    language
                )
            }
        }

    } else {

        if (wallet.provider_cash_back >= appManager.step_value) { // #
            wallet_model.updateOne({ _id: wallet.id }, { $inc: { provider_cash_back: -appManager.step_value, refund_storage: appManager.step_value } }).exec()

        } else if (wallet.provider_cash_back > 0 && wallet.provider_cash_back < appManager.step_value) { // #
            wallet_model.updateOne({ _id: wallet.id }, { provider_cash_back: 0, $inc: { refund_storage: wallet.provider_cash_back } }).exec()

        } else if (wallet.provider_cash_back == 0 && appManager.any_storage >= appManager.step_value) { // #
            app_manager_model.updateOne({ _id: appManager.id }, { $inc: { any_storage: - appManager.step_value } }).exec()
            wallet_model.updateOne({ _id: wallet.id }, { $inc: { refund_storage: appManager.step_value } }).exec()

        } else if (wallet.provider_cash_back == 0 && appManager.any_storage > 0 && appManager.any_storage < appManager.step_value) {  // #
            app_manager_model.updateOne({ _id: appManager.id }, { any_storage: 0 }).exec()
            wallet_model.updateOne({ _id: wallet.id }, { $inc: { refund_storage: appManager.any_storage } }).exec()

        } else if (wallet.provider_cash_back == 0 && appManager.any_storage == 0) {

            if (wallet.referral_cash_back > 0 && wallet.free_click_storage > 0) {
                const referralWallet = await wallet_model.findOne({ user_id: user.referral_id })

                if (referralWallet) {

                    wallet_model.updateOne({ _id: wallet.id }, { $inc: { free_click_storage: -appManager.step_value, refund_storage: -appManager.step_value, referral_cash_back: -appManager.step_value } }).exec()

                    const refUser = await user_model.findById(referralWallet.user_id).select('language')
                    const refFcm = await auth_model.find({ user_id: referralWallet.user_id }).select('fcm').distinct('fcm')

                    if (referralWallet.balance < 1000 && referralWallet.today_gift < appManager.max_day_gift) {

                        wallet_model.updateOne({ _id: referralWallet.id }, { last_gift: todayDate, $inc: { balance: appManager.step_value, total_cash_back: appManager.step_value, today_gift: appManager.step_value } }).exec()

                        if (refFcm && refUser) {
                            sendRefCashBackNotifications(
                                referralWallet.user_id,
                                refFcm,
                                `${user.first_name} ${user.last_name}`,
                                appManager.step_value,
                                refUser.language
                            )
                        }

                    } else {

                        wallet_model.updateOne({ _id: referralWallet.id }, { $inc: { referral_storage: appManager.step_value } }).exec()

                        const arTitle = `استرداد نقدي 49`
                        const enTitlle = `49 Cash Back`
                        const name = `${user.first_name} ${user.last_name}`

                        const arBody = `لقد قام ${name} باستخدام التطبيق وسوف تحصل على ${appManager.step_value} خلال الايام القادمة`
                        const enBody = `${name} has used the App and you will get ${appManager.step_value} within the next few days`


                        sendNotifications(refFcm, refUser.language == 'ar' ? arTitle : enTitlle, '')
                        const object = new notification_model({
                            receiver_id: referralWallet.user_id,
                            tab: 3,
                            type: 1000,
                            text_ar: arBody,
                            text_en: enBody,
                        })

                        object.save()

                    }
                }
            } else if (wallet.referral_cash_back == 0 && wallet.free_click_storage > 0 && wallet.balance < 1000) {
                wallet_model.updateOne({ _id: wallet.id }, { last_gift: todayDate, $inc: { free_click_storage: -appManager.step_value, refund_storage: -appManager.step_value, balance: appManager.step_value, total_cash_back: appManager.step_value, today_gift: appManager.step_value } }).exec()

                if (fcm) {

                    sendCashBackNotifications(
                        user.id,
                        fcm,
                        appManager.step_value,
                        language
                    )
                }
            }
        }
    }
}

export const giftCashBack = async (senderId, userId, total, isCard) => {

    try {

        const appManager = await app_manager_model.findOne({})

        const wallet = await wallet_model.findOne({ user_id: userId })

        if (!appManager || !wallet) return

        const paymentGatewayCuts = (isCard == true ? appManager.pay_mob_constant : 0) + ((appManager.pay_mob_portion * amount) / 100)

        const govermentFees = (amount * (appManager.vat / 100)) + ((amount * appManager.tax) / 100)

        const grossMoney = amount - paymentGatewayCuts - govermentFees

        const overHeadFactor = (appManager.gift_gross_money + grossMoney) / appManager.gift_payment_factor

        const netGross = grossMoney - appManager.over_head_constant

        const xFactor = netGross / appManager.gift_payment_factor

        const clientCashBackProvider = xFactor * appManager.gift_provider_portion

        const fourtyNineStorage = xFactor * appManager.gift_portion

        const net = grossMoney - clientCashBackProvider - fourtyNineStorage

        wallet_model.updateOne({ user_id: userId }, { $inc: { provider_cash_back: clientCashBackProvider } }).exec()

        wallet_model.updateOne({ user_id: senderId }, { $inc: { gross_money: grossMoney, monthly_balance: grossMoney, total_payment: total } }).exec()

        app_manager_model.updateOne({ _id: appManager.id }, {
            $inc: {
                request_storage: (appManager.request_portion * net) / 100,
                call_storage: (appManager.call_portion * net) / 100,
                any_storage: (appManager.any_portion * net) / 100,
                like_storage: (appManager.like_portion * net) / 100,
                view_storage: (appManager.view_portion * net) / 100,
                share_storage: (appManager.share_portion * net) / 100,
                pay_mob_cuts: paymentGatewayCuts,
                amount: amount,
                total_government_fees: govermentFees,
                forty_nine_storage: fourtyNineStorage,
                gross_money: grossMoney,
                total_over_head: overHeadFactor,
                gift_gross_money: grossMoney,
                gift_over_head_factor: overHeadFactor,
            }
        }).exec()

    } catch (e) {
        console.log(e)
    }
}

export const likeCashBack = async (userId, language) => {

    try {

        const wallet = await wallet_model.findOne({ user_id: userId })

        const appManager = await app_manager_model.findOne({})

        if (!wallet || !appManager || wallet.today_likes < 200 || appManager.like_storage < appManager.step_value) return
        if (wallet.refund_storage >= 0) {

            if (appManager.like_storage >= appManager.step_value) {

                wallet_model.updateOne({ user_id: userId }, { today_likes: 0, $inc: { balance: appManager.step_value, total_cash_back: appManager.step_value } }).exec()

                await app_manager_model.updateOne({ _id: appManager.id }, { $inc: { like_storage: -appManager.step_value } })

                const titleAr = `استرداد نقدي 49`
                const titlleEn = `49 Cash Back`

                const bodyEn = `You have got ${appManager.step_value} EGP as a cashback from 49 App becuase you are exceeding the like limit from you followers`
                const bodyAr = `لقد حصلت على ${appManager.step_value} جنيهًا مصريًا كاسترداد نقدي من تطبيق 49 لأنك تجاوزت حد الإعجاب من متابعيك`

                auth_model.find({ user_id: userId }).distinct('fcm').then(fcm => {
                    if (fcm)
                        sendNotifications(fcm, language == 'ar' ? titleAr : titlleEn, '')
                }
                )
                const object = new notification_model({
                    receiver_id: userId,
                    tab: 3,
                    type: 1000,
                    text_ar: bodyAr,
                    text_en: bodyEn,
                })

                object.save()

            } else {
                wallet_model.updateOne({ user_id: userId }, { today_likes: 0 }).exec()
            }


        } else {

            if (appManager.like_storage >= appManager.step_value) {

                await app_manager_model.updateOne({ _id: appManager.id }, { $inc: { like_storage: -appManager.step_value } })
            }
            wallet_model.updateOne({ user_id: userId }, { today_likes: 0, $inc: { refund_storage: appManager.step_value } }).exec()

        }

    } catch (e) {
        console.log(e)
    }
}

export const shareCashBack = async (userId, language) => {

    try {
        const wallet = await wallet_model.findOne({ user_id: userId })
        const appManager = await app_manager_model.findOne({})
        if (!wallet || !fcm || !appManager || wallet.today_shares < 200 || appManager.share_storage < appManager.step_value) return
        if (wallet.refund_storage >= 0) {

            if (appManager.share_storage >= appManager.step_value) {

                wallet_model.updateOne({ user_id: userId }, { today_shares: 0, $inc: { balance: appManager.step_value, total_cash_back: appManager.step_value } }).exec()

                await app_manager_model.updateOne({ _id: appManager.id }, { $inc: { share_storage: -appManager.step_value } })

                const titleAr = `استرداد نقدي 49`
                const titlleEn = `49 Cash Back`

                const bodyEn = `You have got ${appManager.step_value} EGP as a cashback from 49 App becuase you are exceeding the share limit from you followers`
                const bodyAr = `لقد حصلت على ${appManager.step_value} جنيهًا مصريًا كاسترداد نقدي من تطبيق 49 لأنك تجاوزت حد الإعجاب من متابعيك`

                auth_model.find({ user_id: userId }).distinct('fcm').then(fcm => {
                    if (fcm)
                        sendNotifications(fcm, language == 'ar' ? titleAr : titlleEn, '')
                }
                )
                const object = new notification_model({
                    receiver_id: userId,
                    tab: 3,
                    type: 1000,
                    text_ar: bodyAr,
                    text_en: bodyEn,
                })

                object.save()

            } else {
                wallet_model.updateOne({ user_id: userId }, { today_shares: 0 }).exec()
            }


        } else {

            if (appManager.share_storage >= appManager.step_value) {

                await app_manager_model.updateOne({ _id: appManager.id }, { $inc: { share_storage: -appManager.step_value } })
            }
            wallet_model.updateOne({ user_id: userId }, { today_shares: 0, $inc: { refund_storage: appManager.step_value } }).exec()

        }

    } catch (e) {
        console.log(e)
    }


}

export const viewsCashBack = async (userId, language) => {

    try {

        const wallet = await wallet_model.findOne({ user_id: userId })

        const appManager = await app_manager_model.findOne({})

        if (!wallet || !appManager || wallet.today_views < 200 || appManager.view_storage < appManager.step_value) return
        if (wallet.refund_storage >= 0) {

            if (appManager.view_storage >= appManager.step_value) {

                wallet_model.updateOne({ user_id: userId }, { today_views: 0, $inc: { balance: appManager.step_value, total_cash_back: appManager.step_value } }).exec()

                await app_manager_model.updateOne({ _id: appManager.id }, { $inc: { view_storage: -appManager.step_value } })

                const titleAr = `استرداد نقدي 49`
                const titlleEn = `49 Cash Back`

                const bodyEn = `You have got ${appManager.step_value} EGP as a cashback from 49 App becuase you are exceeding the share limit from you followers`
                const bodyAr = `لقد حصلت على ${appManager.step_value} جنيهًا مصريًا كاسترداد نقدي من تطبيق 49 لأنك تجاوزت حد الإعجاب من متابعيك`

                auth_model.find({ user_id: userId }).distinct('fcm').then(fcm => {
                    if (fcm)
                        sendNotifications(fcm, language == 'ar' ? titleAr : titlleEn, '')
                }
                )
                const object = new notification_model({
                    receiver_id: userId,
                    tab: 3,
                    type: 1000,
                    text_ar: bodyAr,
                    text_en: bodyEn,
                })

                object.save()

            } else {
                wallet_model.updateOne({ user_id: userId }, { today_shares: 0 }).exec()
            }


        } else {

            if (appManager.view_storage >= appManager.step_value) {

                await app_manager_model.updateOne({ _id: appManager.id }, { $inc: { view_storage: -appManager.step_value } })
            }
            wallet_model.updateOne({ user_id: userId }, { today_shares: 0, $inc: { refund_storage: appManager.step_value } }).exec()

        }

    } catch (e) {
        console.log(e)
    }


}