import mongoose from 'mongoose'


const schema = new mongoose.Schema({

    receiver_id: { type: String, required: true },
    user_id: { type: String },
    is_read: { type: Boolean, default: false },

    text_ar: { type: String, required: true },
    text_en: { type: String, required: true },
    tab: { type: Number, required: true },
    type: { type: Number, default: 0 },
    direction: { type: String, },

    attachment: { type: String, },
    main_category_id: { type: String, },
    sub_category_id: { type: String, },
    ad_owner: { type: String, },
    request_price: { type: Number, },
    is_accepted: { type: Boolean, default: false },
    phone: { type: String },

}, { versionKey: false, timestamps: true })

export default mongoose.model("notifications", schema);
