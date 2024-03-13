import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    user_id: { type: String, required: true },
    category_id: { type: String, required: true },

    picture: { type: String, required: true },

    id_front: { type: String, required: true },
    id_behind: { type: String, required: true },

    practice_license_front: { type: String, required: true },
    practice_license_behind: { type: String, required: true },

    specialty: { type: String, required: true },
    location: { type: String, required: true },

    work_from: { type: Number, required: true },
    work_to: { type: Number, required: true },

    available_day: { type: Array, required: true },

    rating: { type: Number, default: 5 },

    examination_price: { type: Number, default: 0 },

    waiting_time: { type: Number, default: 0 },

    is_approved: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    is_premium: { type: Boolean, default: false },

    country_code: { type: String, required: true },

    requests: { type: Array, },
    calls: { type: Array, },

}, { versionKey: false, timestamps: true })

export default mongoose.model("doctors", schema);
