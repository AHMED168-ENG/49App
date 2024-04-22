import CryptoJS from "crypto-js"
import jwt from "jsonwebtoken"
//import spawn from 'spawn-npm'
import { spawn, exec, spawnSync } from 'child_process'
import httpStatus from "http-status"
import user_model from './models/user_model.js'

export const serverURL = 'https://api.49hub.com/'
export const filesCloudUrl = 'https://49-space.fra1.digitaloceanspaces.com/'
export var publicIPAddress = ''


export const extractPictureUrls = (pictures) => {
    const car_pictures = pictures.slice(0, 4);
    const [id_front, id_behind, driving_license_front, driving_license_behind, car_license_front, car_license_behind] = pictures.slice(4, 10);
    return { car_pictures, id_front, id_behind, driving_license_front, driving_license_behind, car_license_front, car_license_behind };
};
export const encryptText = (text) => {
    return CryptoJS.AES.encrypt(text, process.env.CRYPTO_KEY).toString()
};

export const decryptText = (text) => {
    return CryptoJS.AES.decrypt(text, process.env.CRYPTO_KEY).toString(CryptoJS.enc.Utf8)
};

export const createToken = (id, auth, authDate, isSuperAdmin, isAdmin) => {

    return jwt.sign(
        {
            id,
            auth,
            isSuperAdmin,
            isAdmin,
            authDate,
        },
        process.env.JWT_KEY,
        { expiresIn: '1000d' },

    )
}

/**
 * @deprecated This function is deprecated from refactor ver. 0.1 Use isAuthenticated
 */
export const verifyToken = async (req, res, next) => {

    try {

        const authorization = req.headers?.authorization
        
        if (authorization) {
            jwt.verify(authorization.split(' ')[1], process.env.SECRET_KEY, async (err, decodedToken) => {
                if((err?.name == "TokenExpiredError")) {
                    return res.status(httpStatus.UNAUTHORIZED).json({
                      message: "token expired",
                        success: false,
                    });
                } else if(!decodedToken) {
                  return res.status(httpStatus.UNAUTHORIZED).json({
                    message: "pad token",
                    success: false,
                  });
                } else  {     
                  const user = await user_model.findOne({
                    _id : decodedToken.id                                                          
                  })          
                  
                  if(user.is_locked) throw buildError(httpStatus.NOT_FOUND , errorWithLanguages({
                    en : "this account is locked",
                    ar : "تم غلق هذا الحساب"
                  }))    
                  req.user = {id : decodedToken.id , email : user.email , isAdmin : decodedToken.isAdmin , isSuperAdmin : decodedToken.isSuperAdmin };                                                       
                  next()
                }

            })
        } else
            return res.status(401).json({ 'status': false, 'message': 'Unauthorized' })

    } catch (e) {
        return res.status(401).json({ 'status': false, 'message': 'Unauthorized' })

    }
}

export const verifyTokenAndAuthorization = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.id === req.params.id || req.user.isAdmin) {
            return next()
        }
        return res.sendStatus(401)
    })
}

export const tryVerify = (req, res, next) => {
    const authorization = req.headers.authorization

    if (authorization && authorization.split('Bearer ')) {
        jwt.verify(authorization.split('Bearer ')[1], process.env.JWT_KEY, (err, user) => {
            if (!err) req.user = user
        })
    }
    next()
}

export const verifyTokenAndSuperAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.isSuperAdmin) {
            return next()
        }
        return res.sendStatus(401)
    })
}
export const verifyTokenAndSuperAdminOrAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.isSuperAdmin || req.user.isAdmin) {
            return next()
        }
        return res.sendStatus(401)
    })
}

export const verifyTokenAndAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.isAdmin) {
            return next()
        }
        return res.sendStatus(401)
    })
}
export function populateResultUserLoading(result, riders, users, ratings, categories, language) {
    for (const ride of result) {
        ride._doc.sub_category_name = '';

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
                };
                break;
            }
        }

        for (const user of users) {
            if (user.id == ride.rider_id) {
                if (ride._doc.rider_info) {
                    ride._doc.rider_info.name = user.first_name;
                    ride._doc.rider_info.picture = user.profile_picture;
                }
                break;
            }
        }

        for (const rating of ratings) {
            if (rating.ad_id == ride.id) {
                ride._doc.rating = rating;
                break;
            }
        }

        for (const category of categories) {
            if (category.id == ride.category_id) {
                ride._doc.sub_category_name = language == 'ar' ? category.name_ar : category.name_en;
                break;
            }
        }
    }
}


export const getUserData = function (doc) {

    return {
        'id': doc._id,
        'first_name': doc.first_name,
        'last_name': doc.last_name,
        'phone': doc.phone,
        'email': doc.email,
        'provider': doc.provider,
        'birth_date': doc.birth_date,
        'referral_id': doc.referral_id,
        'hash_code': doc.hash_code,
        'profile_picture': doc.profile_picture,
        'cover_picture': doc.cover_picture,
        'tender_picture': doc.tender_picture,
        'country': doc.country,
        'language': doc.language,
        'social_status': doc.social_status,
        'city': doc.city,
        'job': doc.job,
        'is_male': doc.is_male,
        'is_locked': doc.is_locked,
        'currency': doc.currency,
        'privacy_country': doc.privacy_country,
        'privacy_email': doc.privacy_email,
        'privacy_phone': doc.privacy_phone,
        'privacy_birth_date': doc.privacy_birth_date,
        'privacy_social_status': doc.privacy_social_status,
        'privacy_job': doc.privacy_job,
        'privacy_city': doc.privacy_city,
        'privacy_is_male': doc.privacy_is_male,
        'privacy_language': doc.privacy_language,
        'privacy_receive_messages': doc.privacy_receive_messages,
        'privacy_last_seen': doc.privacy_last_seen,
        'privacy_friend_list': doc.privacy_friend_list,
        'privacy_follower_list': doc.privacy_follower_list,
        'privacy_activity': doc.privacy_activity,
        'privacy_random_appearance': doc.privacy_random_appearance,
        'privacy_friend_request': doc.privacy_friend_request,
        'privacy_follow_request': doc.privacy_follow_request,
        'privacy_call': doc.privacy_call,
        'bio': doc.bio,
    }
}
export const executeFFMPEG = async (type, command) => {

    return new Promise((resolve, reject) => {

        var proc = spawnSync(type, command.split(' '), { encoding: 'utf8' });

        if (proc.error) return reject(proc.error)
        console.log(proc.output)
        resolve(proc.output)
    });
};

export const getPublicIPAddress = async () => {

    exec('curl ip-adresim.app', function (error, stdout, stderr) {
        if (error)
            return console.log(error)

        //publicIPAddress = `${stdout}:${process.env.PORT}`.replace(/\n/g, "")
        publicIPAddress = '167.99.242.153:3000'
        console.log(publicIPAddress)
    })
};


export const fullUserKeys = 'first_name phone last_name email profile_picture cover_picture provider birth_date referral_id hash_code tender_picture country language social_status city job is_male is_locked currency privacy_country privacy_email privacy_phone privacy_email privacy_birth_date privacy_social_status privacy_job privacy_city privacy_is_male privacy_language privacy_receive_messages privacy_last_seen privacy_friend_list privacy_follower_list privacy_activity privacy_random_appearance privacy_friend_request privacy_follow_request privacy_call bio'

export const baseUserKeys = 'first_name last_name profile_picture cover_picture'
export const dynamicAdKeys = 'user_id sub_category_id main_category_id title desc pictures props is_approved is_active is_premium createdAt'
export const comeWithMeTripKeys = 'phone user_id car_brand car_type car_plate_letters car_plate_numbers user_lat user_lng destination_lat destination_lng from to distance duration passengers price is_repeat time createdAt'
export const pickMeTripKeys = 'phone user_id user_lat user_lng destination_lat destination_lng from to distance duration passengers price is_repeat time createdAt'
export const healthCategoryId = '62c8b57c9332225799fe3306';
