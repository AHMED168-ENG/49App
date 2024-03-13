import mongoose from 'mongoose'


const schema = new mongoose.Schema({

    category_id: { type: String, required: true },

    user_id: { type: String, required: true, unique: true, },

    pictures: { type: Array, required: true, },
    name: { type: String, required: true },
    location: { type: String, required: true },

    work_from: { type: Number, required: true },
    work_to: { type: Number, required: true },

    available_day: { type: Array, required: true },

    rating: { type: Number, default: 5 },

    is_approved: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    is_premium: { type: Boolean, default: false },

    country_code: { type: String, required: true },

    requests: { type: Array, },
    calls: { type: Array, }


}, { versionKey: false, timestamps: true })

export default mongoose.model("restaurants", schema);
