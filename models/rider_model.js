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

    criminal_record: { type: String, },
    technical_examination: { type: String, },
    drug_analysis: { type: String, },

    pricing_per_km: { type: Number, requried: true },

    car_brand: { type: String, required: true },
    car_type: { type: String, required: true },

    car_plate_letters: { type: String, required: true },
    car_plate_numbers: { type: String, required: true },

    rating: { type: Number, default: 5 },
    is_approved: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    is_ready: { type: Boolean, default: true },

    profit: { type: Number, default: 0 },
    indebtedness: { type: Number, default: 0 },
    trips: { type: Number, default: 0 },

    location: { type: Object, default: { type: "Point", coordinates: [0, 0] } },

    free_ride: { type: Boolean, default: false, },
    has_ride: { type: Boolean, default: false, },

    country_code: { type: String, required: true },

    airـconditioner: { type: Boolean, default: false },
    phone: { type: String, },
    car_model_year: { type: String }

}, { versionKey: false, timestamps: true })

const model = mongoose.model("riders", schema);

schema.index({
    location: "2dsphere",
})

export default model