import express from 'express'
import firebase_admin from 'firebase-admin'

import { getUserData, createToken, verifyToken, fullUserKeys } from '../helper.js'
import { sendNotification, sendNotifications } from '../controllers/notification_controller.js'
import user_model from '../models/user_model.js'
import auth_model from '../models/auth_model.js'
import wallet_model from '../models/wallet_model.js'
import notification_model from '../models/notification_model.js'
import app_manager_model from '../models/app_manager_model.js'

const router = express.Router()

const playStoreLink = 'https://play.google.com/store/apps/details?id=com.fourtyninehub.fourtynine'
const appleStoreLink = 'https://apps.apple.com/us/app/49-app/id1632305652'


router.post('/register', async (req, res, next) => {
    try {

        const { language } = req.headers

        const { idToken, first_name, last_name, email, referral_id, currency, country_code, device_id, fcm, gender } = req.body

        if (!idToken || !first_name || !last_name || !email) return next('Bad Request')

        const firebaseUser = await firebase_admin.auth().verifyIdToken(idToken)

        if (firebaseUser) {

            const existUser = await user_model.findOne({ email, uid: firebaseUser.uid, provider: 'email' }).select('_id')

            if (existUser) return next({ 'status': 403, 'message': language == 'ar' ? 'هذا المستخدم مسجل لدينا بالفعل' : 'User is already registered before' })

            if (referral_id) {
                const referralUser = await user_model.findOne({ hash_code: referral_id }).select('_id')
                //if (!referralUser) return next({ 'status': 404, 'message': language == 'ar' ? 'مستخدم الإحالة غير موجود' : 'The Referral User is not exist' })

                if (referralUser) {
                    req.body.referral_id = referralUser._id
                } else {
                    req.body.referral_id = null
                }
            }

            var hashCode = `${Math.floor(Math.random() * 9999)}-${Math.floor(Math.random() * 9999)}-${Math.floor(Math.random() * 9999)}-${Math.floor(Math.random() * 9999)}`
            while (await user_model.findOne({ hash_code: hashCode }).select('_id')) {
                hashCode = `${Math.floor(Math.random() * 9999)}-${Math.floor(Math.random() * 9999)}-${Math.floor(Math.random() * 9999)}-${Math.floor(Math.random() * 9999)}`
            }

            const object = new user_model({
                first_name, last_name,
                hash_code: hashCode,
                referral_id: req.body.referral_id ?? '',
                profile_picture: gender == false ? 'user-profile%20GIRL.png' : 'user-profile%20MAN.png',
                social_status: 0,
                currency,
                country_code,
                provider: 'email',
                email,
                uid: firebaseUser.uid,
                gender,
                device_id,
                phone: email.includes('@49hub.com') ? email.replace('@49hub.com', '') : null,
            })

            const user = await object.save()

            const appManager = await app_manager_model.findOne({}).select('referral_gift welcome_gift referral_id free_click_gift')

            const auth = await auth_model.findOneAndUpdate({ device_id }, { user_id: user.id, fcm }, { upsert: true, new: true, setDefaultsOnInsert: true })

            const walletObject = new wallet_model({
                user_id: user._id, balance: appManager.welcome_gift, refund_storage: -appManager.welcome_gift,
                referral_cash_back: user.referral_id ? appManager.referral_gift : 0,
                free_click_storage: appManager.free_click_gift,
            })

            await walletObject.save()

            const notification = new notification_model({
                receiver_id: user._id,
                text_en: `Thank you for registering with us, You have got ${appManager.welcome_gift} EGP as a welcome from 49 App.`,
                text_ar: ` شكرا جزيلا للتسجيل معنا, لقد حصلت على ${appManager.welcome_gift} جنية كهدية من تطبيق 49`,
                tab: 3,
            })

            notification.save()
            sendNotification(
                fcm,
                user.language == 'ar' ? `${user.first_name} ${user.last_name} اهلا` : `Hi ${user.first_name} ${user.last_name}`,
                user.language == 'ar' ? ` شكرا جزيلا للتسجيل معنا, لقد حصلت على ${appManager.welcome_gift} جنية كهدية من تطبيق 49` : `Thank you for registering with us, You have got ${appManager.welcome_gift} EGP as a welcome from 49 App.`,
            )

            if (user.referral_id) {
                const referralUser = await user_model.findOne({ _id: user.referral_id, is_locked: false }).select('_id language')

                if (referralUser) {
                    const refNotification = new notification_model({
                        receiver_id: referralUser.id,
                        text_en: `Congratulations, ${user.first_name} ${user.last_name} has used your code to register in 49 app, you will get ${appManager.referral_gift} EGP when your friend using the app`,
                        text_ar: `تهانينا, قام ${user.first_name} ${user.last_name} باستخدام الكود الخاص بك للتسجيل في تطبيق 49 , سوف تحصل على ${appManager.referral_gift} جنية عندما يقوم صديقك باستخدام التطبيق`,
                        tab: 3,
                    })
                    await refNotification.save()
                    const fcm = await auth_model.find({ user_id: referralUser._id }).distinct('fcm')

                    if (fcm)
                        sendNotifications(
                            fcm,
                            referralUser.language == 'ar' ? `اشعار من 49` : '49 Notification',
                            referralUser.language == 'ar' ? `تهانينا, قام ${user.first_name} ${user.last_name} باستخدام الكود الخاص بك للتسجيل في تطبيق 49 , سوف تحصل على ${appManager.referral_gift} جنية عندما يقوم صديقك باستخدام التطبيق` : `Congratulations, ${user.first_name} ${user.last_name} has used your code to register in 49 app, you will get ${appManager.referral_gift} EGP when your friend using the app`,
                        )
                }
            }
            return res.json({
                'status': true,
                'data': {
                    ...getUserData(user),
                    'token': createToken(user.id, auth.id, auth._doc.updatedAt, false, false)
                }
            })
        }
        return next(language == 'ar' ? 'حدث خطأ ما' : 'There is an Error')

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.post('/login', async (req, res, next) => {

    try {

        const { language } = req.headers

        const { idToken, email, fcm, device_id, currency, country_code } = req.body

        if (!idToken || !email) return next('Bad Request')

        const firebaseUser = await firebase_admin.auth().verifyIdToken(idToken)

        if (firebaseUser && firebaseUser.email == email.toLowerCase()) {

            const user = await user_model.findOne({ email, provider: 'email' }).select(fullUserKeys)

            if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'المستخدم غير موجود' : 'User not found' })

            if (user.is_locked == true) return next({ 'status': 401, 'message': language == 'ar' ? 'تم غلق حسابك' : 'Your Account is Locked' })

            const auth = await auth_model.findOneAndUpdate({ device_id }, { user_id: user.id, fcm, currency, country_code }, { upsert: true, new: true, setDefaultsOnInsert: true })

            return res.json({
                'status': true,
                'data': {
                    ...getUserData(user),
                    'token': createToken(user.id, auth.id, auth._doc.updatedAt, false, false)
                }
            })
        }

        return next(language == 'ar' ? 'حدث خطأ ما' : 'There is an Error')
    } catch (e) {
        console.log(e)
        next(e)
    }
}
)

router.post('/social-login', async (req, res, next) => {

    try {

        const { language } = req.headers

        const { idToken, fcm, device_id, currency, country_code } = req.body

        if (!idToken || !device_id) return next('Bad Request')

        const firebaseUser = await firebase_admin.auth().verifyIdToken(idToken)

        if (firebaseUser) {

            const { name, picture, uid, email, phone } = firebaseUser

            const provider = firebaseUser.firebase.sign_in_provider

            const existUser = await user_model.findOne({ provider, email }).select(fullUserKeys)

            if (!existUser) {

                var hashCode = Math.floor(Math.random() * 9000000000000)
                while (await user_model.findOne({ hash_code: hashCode }).select('_id')) {
                    hashCode = Math.floor(Math.random() * 9000000000000)
                }

                const userObject = new user_model({
                    first_name: name,
                    last_name: ' ',
                    phone,
                    profile_picture: picture,
                    provider,
                    email,
                    uid,
                    hash_code: hashCode,
                    currency,
                    country_code,
                })

                const user = await userObject.save()

                const appManager = await app_manager_model.findOne({}).select('welcome_gift free_click_gift')

                const auth = await auth_model.findOneAndUpdate({ device_id }, { user_id: user.id, fcm }, { upsert: true, new: true, setDefaultsOnInsert: true })
                const walletObject = new wallet_model({
                    user_id: user._id, balance: appManager.welcome_gift, refund_storage: -appManager.welcome_gift,
                    referral_cash_back: user.referral_id ? appManager.referral_gift : 0,
                    free_click_storage: appManager.free_click_gift,
                })

                await walletObject.save()
                const notification = new notification_model({
                    receiver_id: user._id,
                    text_en: `Thank you for registering with us, You have got ${appManager.welcome_gift} EGP as a welcome from 49 App.`,
                    text_ar: ` شكرا جزيلا للتسجيل معنا, لقد حصلت على ${appManager.welcome_gift} جنية كهدية من تطبيق 49`,
                    tab: 3,
                })

                notification.save()
                sendNotification(
                    fcm,
                    user.language == 'ar' ? `${user.first_name} ${user.last_name} اهلا` : `Hi ${user.first_name} ${user.last_name}`,
                    user.language == 'ar' ? ` شكرا جزيلا للتسجيل معنا, لقد حصلت على ${appManager.welcome_gift} جنية كهدية من تطبيق 49` : `Thank you for registering with us, You have got ${appManager.welcome_gift} EGP as a welcome from 49 App.`,
                )
                return res.json({
                    'status': true,
                    'data': {
                        ...getUserData(user),
                        'token': createToken(user.id, auth.id, auth._doc.updatedAt, false, false)
                    }
                })
            } else {
                const auth = await auth_model.findOneAndUpdate({ device_id }, { user_id: existUser.id, fcm }, { upsert: true, new: true, setDefaultsOnInsert: true })
                return res.json({
                    'status': true,
                    'data': {
                        ...getUserData(existUser),
                        'token': createToken(existUser.id, auth.id, auth._doc.updatedAt, false, false)
                    }
                })
            }
        }
        return next(language == 'ar' ? 'حدث خطأ ما' : 'There is an Error')
    } catch (e) {
        next(e)
    }
})

router.get('/welcome-gift', async (req, res, next) => {

    try {
        const appManager = await app_manager_model.findOne({}).select('welcome_gift')

        res.json({ 'gift': appManager.welcome_gift })
    } catch (e) {
        next(e)
    }
})

router.get('/referral-gift', async (req, res, next) => {

    try {

        const appManager = await app_manager_model.findOne({}).select('referral_gift welcome_gift')

        delete appManager._doc._id

        appManager._doc.apple_store_link = appleStoreLink
        appManager._doc.play_store_link = playStoreLink

        res.json(appManager)
    } catch (e) {
        next(e)
    }
})

router.get('/logout', verifyToken, async (req, res, next) => {

    try {

        await auth_model.deleteOne({ _id: req.user.auth })

        res.json({ 'status': true, })

    } catch (e) {
        next()
    }
})

export default router