import mongoose from 'mongoose'


const schema = new mongoose.Schema({

    user_id: { type: String, required: true },

    song_id: { type: String },
    song_owner_id: { type: String },
    desc: { type: String, default: '' },
    is_reel: { type: Boolean, default: true },

    thumb_url: { type: String, required: true },
    video_url: { type: String, required: true },

    expire_at: { type: Date, default: Date.now, expires: 86400 },

    country_code: { type: String },

    views: { type: Array, },
    likes: { type: Array, },
    shares: { type: Array, },

}, { versionKey: false, timestamps: true })

const model = mongoose.model("reels", schema);

schema.index({ "expire_at": 1 }, { expireAfterSeconds: 0 });
export default model
