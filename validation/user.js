import passwordValidator from "password-validator";
import user_model from '../models/user_model.js'
import { check , query } from "express-validator";

export function createUserValidation () {
    return [
        check("email").notEmpty().withMessage(JSON.stringify({
            "ar" : "قم بادخال ايميل المستخدم",
            "en" : "enter user email please",
        })).isEmail().withMessage(JSON.stringify({
            "ar" : "قم بادخال ايميل صحيح",
            "en" : "enter valid email please",
        })).trim().toLowerCase(),
        check("first_name").notEmpty().withMessage(JSON.stringify({
            "ar" :"ادخل الاسم الاول",
            "en" : "enter first name user please",
        })),
        check("last_name").notEmpty().withMessage(JSON.stringify({
            "ar" :"ادخل الاسم الاخير",
            "en" : "enter last name user please",
        })),
        check("fcm").notEmpty().withMessage(JSON.stringify({
            "ar" :"ادخل fcm",
            "en" : "enter fcm",
        })),
        check("device_id").notEmpty().withMessage(JSON.stringify({
            "ar" :"ادخل device_id",
            "en" : "enter device_id",
        })),
        passwordLength(),
        password()
    ]
}

export function updateUserValidation () {
    return [
        check("email").optional().isEmail().withMessage().trim().toLowerCase(),
        password()
    ]
}

export function loginUserValidation () {
    return [
        check("email").notEmpty().withMessage(JSON.stringify({
            "ar" : "قم بادخال ايميل المستخدم",
            "en" : "enter user email please",
        })).isEmail().withMessage(JSON.stringify({
            "ar" : "قم بادخال ايميل صحيح",
            "en" : "enter valid email please",
        })).custom(async(val , req) => {
            const user = await user_model.findOne({email : val})
            if(!user) return Promise.reject(JSON.stringify({
                "ar" : "هذا الايميل مسجل بالفعل",
                "en" : "this email already existed",
            }))
            return true
        }).trim().toLowerCase(),
    ],
    passwordLength()
}

export function passwordLength () {
    return check("password").notEmpty().withMessage(JSON.stringify({
        "ar" : "قم بادخال الرقم السري",
        "en" : "password should contain lower case and upper case and should be minimum 8 and should be max 20 and should contain at lest 2 symbols and special character",
    }))
    
}

export function password () {
    return check("password").custom((val , {req}) => {
        if(!val) return true
        let passValidator = new passwordValidator()
        passValidator
        .is()
        .min(8)
        .is()
        .max(20)
        .is()   
        .lowercase(1)
        .is()        
        .uppercase(1)
        .has()
        .digits(1)   
        .has()
        .symbols(1)                                                                
        if(!passValidator.validate(val)) {    
            throw new Error("")
        }
        return true
    }).withMessage(JSON.stringify({
        "ar" : "قم بادخال الرقم السري",
        "en" : "password should contain lower case and upper case and should be minimum 8 and should be max 20 and should contain at lest 2 symbols and special character",
    })) 
    
}

export function checkOtpValidation () {
    return [
        check("otp").notEmpty().withMessage(JSON.stringify({
            "ar" : "قم بادخال ال otp",
            "en" : "enter otp please",
        })),
        emailForgetPassword()
    ]
}

export function resetPasswordValidation () {
    return [
        query("token").notEmpty().withMessage(JSON.stringify({
            "ar" : "قم بادخال ال otp",
            "en" : "enter otp please",
        })),
        passwordLength(),
        password(),
        emailForgetPassword()
    ]
}

export function emailForgetPassword () {
    return check("email").notEmpty().withMessage(JSON.stringify({
        "ar" : "قم بادخال ايميل المستخدم",
        "en" : "enter user email please",
    })).isEmail().withMessage(JSON.stringify({
        "ar" : "قم بادخال ايميل المستخدم",
        "en" : "enter user email please",
    }))
    .custom(async(userEmail , {req}) => {
        const user = await user_model.findOne({email : userEmail})
        if(!user) {
            return Promise.reject(JSON.stringify({
                "ar" : "هذا الايميل غير مسجل",
                "en" : "this email not register",
            }))
        }
        return true
    })
}

export function forgetPasswordValidation () {
    return [
        emailForgetPassword()
    ]
}

export function updatePassword () {
    return [
        password(),
        check("oldPassword").notEmpty().withMessage(JSON.stringify({
            "ar" : "ادخل الرقم السري القديم",
            "en" : "enter old password",
        })),
        check("password").notEmpty().withMessage(JSON.stringify({
            "ar" : "قم بادخال الرقم السري",
            "en" : "password should contain lower case and upper case and should be minimum 8 and should be max 20 and should contain at lest 2 symbols and special character",
        })),
        check("confirmPassword").custom((val , {req}) => {
            if(req.body.password && !val ) return Promise.reject(JSON.stringify({
                "ar" : "قم بادخال الرقم السري مره اخري",
                "en" : "enter confirm password",
            }))
            if(req.body.password !== val ) return Promise.reject(JSON.stringify({
                "ar" : "الرقم السري غير متطابق",
                "en" : "your confirm password not duplicated",
            }))
            return true
        })
    ]
}

export function updatePasswordForAdmin () {
    return [
        password(),
        check("password").notEmpty().withMessage(JSON.stringify({
            "ar" : "قم بادخال الرقم السري",
            "en" : "password should contain lower case and upper case and should be minimum 8 and should be max 20 and should contain at lest 2 symbols and special character",
        })),
        check("confirmPassword").custom((val , {req}) => {
            if(req.body.password && !val ) return Promise.reject(JSON.stringify({
                "ar" : "قم بادخال الرقم السري مره اخري",
                "en" : "enter confirm password",
            }))
            if(req.body.password !== val ) return Promise.reject(JSON.stringify({
                "ar" : "الرقم السري غير متطابق",
                "en" : "your confirm password not duplicated",
            }))
            return true
        })
    ]
}

export function updateUserLocation() {
    return [
        check("longitude").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال خط الطول",
          en: "Enter longitude"
      })),
        check("latitude").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال خط الطول",
          en: "Enter latitude"
      })),
    ];
  }