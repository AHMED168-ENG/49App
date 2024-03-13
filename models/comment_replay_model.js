import mongoose from 'mongoose'


const schema = new mongoose.Schema({

    comment_id: { type: String, required: true },
    user_id: { type: String, required: true }, // replay owner

    text: { type: String, required: true },

    likes: { type: Array, },
    love: { type: Array, },
    wow: { type: Array, },
    sad: { type: Array, },
    angry: { type: Array, },

    picture: { type: String },
    video: { type: String },

}, { versionKey: false, timestamps: true })

export default mongoose.model("comment_replies", schema);
