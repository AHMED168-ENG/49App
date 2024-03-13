import CryptoJS from "crypto-js"
import jwt from "jsonwebtoken"
//import spawn from 'spawn-npm'
import { spawn, exec, spawnSync } from 'child_process'

export const serverURL = 'https://api.49hub.com/'
export const filesCloudUrl = 'https://49-space.fra1.digitaloceanspaces.com/'
export var publicIPAddress = ''

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

export const verifyToken = (req, res, next) => {

    try {

        const authorization = req.headers.authorization

        if (authorization) {
            jwt.verify(authorization.split('Bearer ')[1], process.env.JWT_KEY, (err, user) => {

                if (err) return res.status(401).json({ 'status': false, 'message': 'Unauthorized' })
                req.user = user
                return next()

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
