import express from 'express'
import { sendNotifications } from '../controllers/notification_controller.js'
import { amanPayout, bankCardPayout, getPayoutToken, walletPayout } from '../controllers/paymob_controller.js'
import { verifyToken } from '../helper.js'
import auth_model from '../models/auth_model.js'
import notification_model from '../models/notification_model.js'
import user_model from '../models/user_model.js'
import wallet_model from '../models/wallet_model.js'
const router = express.Router()

const amountTransfer = 10

router.post('/mobile-wallet', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { operator, number } = req.body

        if (!operator || !number) return next('Bad Request')

        const user = await user_model.findOne({ _id: req.user.id, is_locked: false }).select('_id')
        const wallet = await wallet_model.findOne({ user_id: req.user.id }).select('balance')

        if (!user || !wallet) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        if (wallet.balance < 1002) return next({ 'status': 400, 'message': language == 'ar' ? 'يجب ان يكون رصيدك على الاقل 1002' : 'Your balance must be at least 1002' })

        const token = await getPayoutToken()

        const result = await walletPayout(token, amountTransfer, operator, number)

        if (result.disbursement_status == 'successful') {

            await wallet_model.updateOne({
                user_id: req.user.id,
            }, {
                $inc: { balance: -amountTransfer }
            })

            const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

            const titleAr = 'عملية سحب ناجحة'
            const titleEn = 'Successful withdrawal'

            const bodyAr = `تم سحب ${amountTransfer} جنيه مصرى من رصيد حسابك على محفظة ${operator} ${number}`
            const bodyEn = `${amountTransfer} EGP has been withdrawn from your account balance on ${operator} ${number} wallet`

            const notification = new notification_model({
                receiver_id: req.user.id,
                tab: 3,
                text_ar: bodyAr,
                text_en: bodyEn,
                type: 1000,
            })

            await notification.save()

            sendNotifications(
                fcm,
                language == 'ar' ? titleAr : titleEn,
                language == 'ar' ? bodyAr : bodyEn,
                1000,
            )

            res.json({ 'status': true })
        }
        else {
            next({ 'status': 500, 'message': result.status_description ?? (language == 'ar' ? 'حدث خطأ ما برجاء المحاولة لاحقا' : 'Something went wrong, please try again later') })
        }
    } catch (e) {

        console.log(e)
        next(e)
    }
})

router.post('/bank-wallet', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { number } = req.body

        if (!number) return next('Bad Request')

        const user = await user_model.findOne({ _id: req.user.id, is_locked: false }).select('_id')
        const wallet = await wallet_model.findOne({ user_id: req.user.id }).select('balance')

        if (!user || !wallet) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        if (wallet.balance < 1002) return next({ 'status': 400, 'message': language == 'ar' ? 'يجب ان يكون رصيدك على الاقل 1002' : 'Your balance must be at least 1002' })

        const token = await getPayoutToken()

        const result = await walletPayout(token, amountTransfer, 'bank_wallet', number)

        if (result.disbursement_status == 'successful') {

            await wallet_model.updateOne({
                user_id: req.user.id,
            }, {
                $inc: { balance: -amountTransfer }
            })

            const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

            const titleAr = 'عملية سحب ناجحة'
            const titleEn = 'Successful withdrawal'

            const bodyAr = `تم سحب ${amountTransfer} جنيه مصرى من رصيد حسابك على محفظة البنك رقم ${number}`
            const bodyEn = `${amountTransfer} EGP has been withdrawn from your account balance on the bank wallet number ${number}`

            const notification = new notification_model({
                receiver_id: req.user.id,
                tab: 3,
                text_ar: bodyAr,
                text_en: bodyEn,
                type: 1000,
            })

            await notification.save()

            sendNotifications(
                fcm,
                language == 'ar' ? titleAr : titleEn,
                language == 'ar' ? bodyAr : bodyEn,
                1000,
            )

            res.json({ 'status': true })
        }
        else {
            next({ 'status': 500, 'message': result.status_description ?? (language == 'ar' ? 'حدث خطأ ما برجاء المحاولة لاحقا' : 'Something went wrong, please try again later') })
        }
    } catch (e) {

        console.log(e)
        next(e)
    }
})

router.post('/aman', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { number } = req.body

        if (!number) return next('Bad Request')

        const user = await user_model.findOne({ _id: req.user.id, is_locked: false }).select('_id first_name last_name email')
        const wallet = await wallet_model.findOne({ user_id: req.user.id }).select('balance')

        if (!user || !wallet) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        if (wallet.balance < 1002) return next({ 'status': 400, 'message': language == 'ar' ? 'يجب ان يكون رصيدك على الاقل 1002' : 'Your balance must be at least 1002' })

        const token = await getPayoutToken()

        const result = await amanPayout(token, amountTransfer, number, user.first_name ?? 'NA', user.last_name ?? 'NA', user.email ?? 'NA')

        if (result.disbursement_status == 'successful') {

            const amanCode = result.aman_cashing_details.bill_reference

            await wallet_model.updateOne({
                user_id: req.user.id,
            }, {
                $inc: { balance: -amountTransfer }
            })

            const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

            const titleAr = 'عملية سحب ناجحة'
            const titleEn = 'Successful withdrawal'

            const bodyAr = `تم سحب ${amountTransfer} جنيه مصرى من رصيد حسابك على رقم ${number} برجاء التوجه الى فرع أمان وأسال عن مدفوعات أكسبت واستخدم الكود الخاص ${amanCode} لصرف المبلغ`
            const bodyEn = `${amountTransfer} EGP has been withdrawn from your account balance on Number ${number} Please go to Aman branch and ask about the accept payment and use the code ${amanCode} to exchange the amount`

            const notification = new notification_model({
                receiver_id: req.user.id,
                tab: 3,
                text_ar: bodyAr,
                text_en: bodyEn,
                type: 1000,
            })

            await notification.save()

            sendNotifications(
                fcm,
                language == 'ar' ? titleAr : titleEn,
                language == 'ar' ? bodyAr : bodyEn,
                1000,
            )

            res.json({ 'status': true })
        }
        else {
            next({ 'status': 500, 'message': result.status_description ?? (language == 'ar' ? 'حدث خطأ ما برجاء المحاولة لاحقا' : 'Something went wrong, please try again later') })
        }
    } catch (e) {

        console.log(e)
        next(e)
    }
})

router.post('/bank', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { number, full_name, bank_code } = req.body

        if (!number || !full_name || !bank_code) return next('Bad Request')

        const user = await user_model.findOne({ _id: req.user.id, is_locked: false }).select('_id')
        const wallet = await wallet_model.findOne({ user_id: req.user.id }).select('balance')

        if (!user || !wallet) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

        if (wallet.balance < 1002) return next({ 'status': 400, 'message': language == 'ar' ? 'يجب ان يكون رصيدك على الاقل 1002' : 'Your balance must be at least 1002' })

        const token = await getPayoutToken()

        const result = await bankCardPayout(token, amountTransfer, full_name, number, bank_code)

        if (result.disbursement_status == 'successful') {

            await wallet_model.updateOne({
                user_id: req.user.id,
            }, {
                $inc: { balance: -amountTransfer }
            })

            const fcm = await auth_model.findOne({ user_id: user.id }).distinct('fcm')

            const titleAr = 'عملية سحب ناجحة'
            const titleEn = 'Successful withdrawal'

            const bodyAr = `تم سحب ${amountTransfer} جنيه مصرى من رصيد حسابك على حساب البنك رقم ${number}`
            const bodyEn = `${amountTransfer} EGP has been withdrawn from your account balance on the bank account number ${number}`

            const notification = new notification_model({
                receiver_id: req.user.id,
                tab: 3,
                text_ar: bodyAr,
                text_en: bodyEn,
                type: 1000,
            })

            await notification.save()

            sendNotifications(
                fcm,
                language == 'ar' ? titleAr : titleEn,
                language == 'ar' ? bodyAr : bodyEn,
                1000,
            )

            res.json({ 'status': true })
        }
        else {
            next({ 'status': 500, 'message': result.status_description ?? (language == 'ar' ? 'حدث خطأ ما برجاء المحاولة لاحقا' : 'Something went wrong, please try again later') })
        }
    } catch (e) {

        console.log(e)
        next(e)
    }
})

export default router