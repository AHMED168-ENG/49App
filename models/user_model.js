import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2';
import bcrypt from "bcrypt";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const schema = new mongoose.Schema({

    first_name: { type: String, required: true },
    last_name: { type: String, required: true },

    email: { type: String, requried: true, unique: true },
    password: { type: String, requried: true },
    otp : {
        type : Number,
    },
    passwordResetExpiration : {
        type : Date,           
    },
    user_lat: { type: Number },
    user_lng: { type: Number },

    provider: { type: String, requried: true, default: 'email' },
    uid: { type: String, requried: true, default: '_' },

    phone: { type: String },
    birth_date: { type: String, default: '' },
    referral_id: { type: String, default: '' },
    hash_code: { type: String, required: true, unique: true },
    profile_picture: { type: String, default: '', },
    cover_picture: { type: String, default: '' },
    tinder_picture: { type: String, default: '' },
    country: { type: String, default: '' },
    city: { type: String, default: '' },
    job: { type: String, default: '' },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'EGP' },
    country_code: { type: String, defualt: 'EG' },

    social_status: { type: Number, default: 0 },

    is_male: { type: Boolean },

    is_locked: { type: Boolean, default: false },
    locked_days: { type: Number, default: 0 },


    privacy_country: { type: Number, default: 2 },
    privacy_phone: { type: Number, default: 1 },
    privacy_email: { type: Number, default: 1 },
    privacy_birth_date: { type: Number, default: 2 },
    privacy_social_status: { type: Number, default: 2 },
    privacy_job: { type: Number, default: 2 },
    privacy_city: { type: Number, default: 2 },
    privacy_is_male: { type: Number, default: 2 },
    privacy_language: { type: Number, default: 2 },

    privacy_receive_messages: { type: Number, default: 2 },
    privacy_last_seen: { type: Number, default: 2 },
    privacy_friend_list: { type: Number, default: 2 },
    privacy_follower_list: { type: Number, default: 2 },
    privacy_activity: { type: Number, default: 2 }, // for tinder
    privacy_random_appearance: { type: Number, default: 2 }, // ظهور عشوائي في tinder
    privacy_friend_request: { type: Number, default: 2 },
    privacy_follow_request: { type: Number, default: 2 },
    privacy_call: { type: Number, default: 2 },


    is_rider: { type: Boolean, default: false, },       
    is_doctor: { type: Boolean, default: false },       
    is_restaurant: { type: Boolean, default: false },     
    is_loading: { type: Boolean, default: false },

    friends: { type: Array, default: [] },
    friend_requests: { type: Array, default: [] },
    followers: { type: Array, default: [] },
    following: { type: Array, default: [] },

    block: { type: Array, default: [] },
    hide_posts: { type: Array, default: [] },

    is_online: { type: Boolean, default: false },
    last_seen: { type: String },

    bio: { type: String, maxLength: 100 },
    // device_id: { type: String, required: true },

}, { versionKey: false, timestamps: true })

schema.methods.comparePassword = function (password) { 
    return bcrypt.compareSync(password , this.password) 
}

schema.methods.toJSON = function () {
    const user = this.toObject()
    delete user.password
    return user
}

schema.plugin(mongooseAggregatePaginate);
schema.plugin(mongoosePaginate);

export default mongoose.model("users", schema);
