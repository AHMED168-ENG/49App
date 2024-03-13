import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    user_id: { type: String, required: true },
    fcm: { type: String, },
    device_id: { type: String, required: true },

}, { versionKey: false, timestamps: true })

export default mongoose.model("auth", schema);