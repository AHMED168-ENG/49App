import mongoose from 'mongoose'


const schema = new mongoose.Schema({

    user_id: { type: String, required: true },
    sub_category_id: { type: String, required: true },
    main_category_id: { type: String, required: true },

    title: { type: String, required: true },
    desc: { type: String, required: true },
    pictures: { type: Array, required: true },

    props: { type: Array, required: true },

    is_approved: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    is_premium: { type: Boolean, default: false },

    views: { type: Array },
    requests: { type: Array },
    calls: { type: Array },

    country_code: { type: String, required: true },


}, { versionKey: false, timestamps: true })

export default mongoose.model("dynamic_ads", schema);