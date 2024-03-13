import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    user_id: { type: String },
    text: { type: String },
    type: { type: Number, required: true },
    category: { type: Number, required: true },
    voice: { type: String },
    video: { type: String },
    picture: { type: String, required: true },

    days: { type: Number, required: true },
    is_active: { type: Boolean, required: true },

}, { versionKey: false, timestamps: true })

export default mongoose.model("app_radio_items", schema);