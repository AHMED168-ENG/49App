import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    category_id: { type: String, required: true },

    user_id: { type: String, required: true, unique: true, },
    car_pictures: { type: Array, required: true, },

    id_front: { type: String, required: true },
    id_behind: { type: String, required: true },

    driving_license_front: { type: String, required: true },
    driving_license_behind: { type: String, required: true },

    car_license_front: { type: String, required: true },
    car_license_behind: { type: String, required: true },

    rating: { type: Number, default: 5 },
    is_approved: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },

    profit: { type: Number, default: 0 },

    trips: { type: Number, default: 0 },

    country_code: { type: String, required: true },
    location: { type: String, required: true },
    car_brand: { type: String, required: true },
    car_type: { type: String, required: true },
    phone: { type: String },


}, { versionKey: false, timestamps: true })

export default mongoose.model("loadings", schema);
