import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    user_id: { type: String, required: true },
    ad_id: { type: String, required: true },
    phone: { type: String, required: true },
    is_pay_valid: { type: Boolean, default: false },
    is_winner: { type: Boolean, default: false },
    date: { type: String, required: true },
    user: { type: Object },
    times: { type: Number },
}, { versionKey: false, timestamps: true })

export default mongoose.model("monthly_contest", schema);