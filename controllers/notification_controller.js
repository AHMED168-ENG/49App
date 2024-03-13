import firebaseAdmin from 'firebase-admin'
import notification_model from '../models/notification_model.js'
import admin_fcm_model from '../models/admin_fcm_model.js';

export const sendNotification = function (fcm, title, body) {

    if (fcm && title && body) {
        const payload = {
            "token": fcm,
            "notification": {
                "title": title,
                "body": body,
            },
            data: {
                "click_action": "FLUTTER_NOTIFICATION_CLICK",
            }
        }
        firebaseAdmin.messaging().send(payload)
            .then((response) => {

                console.log(response)

            })
            .catch((error) => {

                console.log(error)
            });
    }
}

export const sendNotifications = function (fcm, title, body, type, direction, attachment) {

    if (fcm.length > 0 && title && body) {

        const payload = {
            "tokens": fcm,
            "notification": {
                "title": title,
                "body": body,
            },
            data: {
                "click_action": "FLUTTER_NOTIFICATION_CLICK",
                // 'click_type': String(type),
                // 'click_data': String(data),
                //  'attachment': String(attachment),
            }
        }
        if (type) payload.data.click_type = String(type)
        if (direction) payload.data.click_direction = String(direction)
        if (attachment) payload.data.click_attachment = String(attachment)

        firebaseAdmin.messaging().sendMulticast(payload)
            .then((response) => {
                console.log(response)

            })
            .catch((error) => {

                console.log(error)
            });
    }
}

export const sendNotificationToAll = async function (title, body) {

    try {
        if (title && body) {

            const payload = {
                "topic": 'all',
                "notification": {
                    "title": title,
                    "body": body,
                },
                data: {
                    "click_action": "FLUTTER_NOTIFICATION_CLICK",
                }
            }
            await firebaseAdmin.messaging().send(payload)


        }
    } catch (e) {
        console.log(e)
    }
}

export const sendCashBackNotifications = function (userId, fcm, step, language) {

    //console.log(fcm)

    if (userId && fcm && step) {

        const arTitle = `استرداد نقدي 49`
        const enTitlle = `49 Cashback`

        const arBody = `لقد حصلت على ${step} جنية من تطبيق 49`
        const enBody = `You have got ${step} EGP from 49 App`

        const object = new notification_model({
            receiver_id: userId,
            tab: 3,
            type: 1000,
            text_ar: arBody,
            text_en: enBody,
        })

        object.save()

        const payload = {
            "tokens": fcm,
            "notification": {
                "title": language == 'ar' ? arTitle : enTitlle,
                "body": language == 'ar' ? arBody : enBody,
            },
            data: {
                "click_action": "FLUTTER_NOTIFICATION_CLICK",
                'click_type': String(1000)
            }
        }

        firebaseAdmin.messaging().sendMulticast(payload)
            .then((response) => {
                console.log(response)

            })
            .catch((error) => {

                console.log(error)
            });
    }
}

export const sendRefCashBackNotifications = function (userId, fcm, name, step, language) {

    if (userId && fcm && step && name && language) {

        const arTitle = `استرداد نقدي 49`
        const enTitlle = `49 Cash Back`

        const arBody = ` لقد قام ${name} باستخدام التطبيق وقد حصلت على ${step} جنية من تطبيق 49`
        const enBody = `${name} has used the app and you have got ${step} EGP from 49 App`

        const object = new notification_model({
            receiver_id: userId,
            tab: 3,
            type: 1000,
            text_ar: arBody,
            text_en: enBody,
        })

        object.save()

        const payload = {
            "tokens": fcm,
            "notification": {
                "title": language == 'ar' ? arTitle : enTitlle,
                "body": language == 'ar' ? arBody : enBody,
            },
            data: {
                "click_action": "FLUTTER_NOTIFICATION_CLICK",
                "click_type": String(1000),
            }
        }

        firebaseAdmin.messaging().sendMulticast(payload)
            .then((response) => {
                //  console.log(response)

            })
            .catch((error) => {

                console.log(error)
            });
    }
}

export const addAdminFcm = async function (fcm) {

    try {
        const new_fcm = new admin_fcm_model({ fcm })
        await new_fcm.save()
    } catch (e) { }
};


export const sendNotificationToAdmin = async function (title, body) {

    const fcm = await admin_fcm_model.find().distinct('fcm');
    if (fcm.length == 0) return;

    if (fcm && title && body) {
        const payload = {
            "tokens": fcm,
            "notification": {
                "title": title,
                "body": body,
            },
            data: {
                "click_action": "FLUTTER_NOTIFICATION_CLICK",
            }
        }
        firebaseAdmin.messaging().sendMulticast(payload)
            .then((response) => {
                console.log(response)
            })
            .catch((error) => {
                console.log(error)
            });
    }
}
