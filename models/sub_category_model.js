// daily_price
// portion
// provider_portion
// payment_factor
// gross_money // -fees 

import mongoose from 'mongoose'

const schema = new mongoose.Schema({

    name_ar: { type: String, required: true },
    name_en: { type: String, required: true },
    is_hidden: { type: Boolean, default: false },

    parent: { type: String, required: true },
    daily_price: { type: Number, default: 0 },
    portion: { type: Number, required: true }, // () نصيب صاحب التطبيق
    provider_portion: { type: Number, required: true }, // 

    payment_factor: { type: Number, required: true },
    over_head_factor: { type: Number, default: 0 },
    gross_money: { type: Number, default: 0 },

    picture: { type: String, required: true },
    index: { type: Number, required: true },


}, { versionKey: false, timestamps: true, })

export default mongoose.model("sub_categories", schema);
