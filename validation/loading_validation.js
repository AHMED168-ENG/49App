import { check } from 'express-validator'

export const validationRegisterLoading = () => {

    return [
        check("car_brand").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل براند السيارة",
            "en" : "enter car brand",
        })),
        check("car_type").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل نوع السيارة",
            "en" : "enter car type",
        })),
        check("category_id").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل القسم الخاص السيارة",
            "en" : "enter car type",
        })),
        check("location").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل موقع السيارة",
            "en" : "enter car type",
        })),
        check("pictures").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل صور السيارة",
            "en" : "enter car type",
        })),
    ]
}

export const validationLoadingRating = () => {

    return [
        check("category_id").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل القسم الخاص السيارة",
            "en" : "enter car type",
        })),
        check("ad_id").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل السيارة",
            "en" : "enter car type",
        })),
        check("user_id").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل المستخدم",
            "en" : "enter user",
        })),
    ]
}


export const requestLoadingValidation = () => {
    return [
        check("category_id").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل القسم الخاص السيارة",
            "en" : "enter car type",
        })),
        check("receipt_point").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل مكان الوصول",
            "en" : "enter receipt point",
        })),
        check("delivery_point").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل مكان الوصول",
            "en" : "enter delivery point",
        })),
        check("price").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل السعر",
            "en" : "enter price",
        })),
        check("time").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل الموعد",
            "en" : "enter time",
        })),
    ]
}


export const validateLoadingOffer =  ()=>{
    return [
        check("adId").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل الاعلان الخاص بالتوصيله",
            "en" : "enter advertise Id",
        })),
        check("price").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل سعر الوصول",
            "en" : "enter price",
        })),
    ]
}


export const acceptLoadingOfferValidation =  ()=>{
    return [
        check("notificationId").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل الاشعار",
            "en" : "enter notification Id",
        })),
        check("adId").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل الاعلان الخاص السيارة",
            "en" : "enter loading advertise Id",
        })),
    ]
}
