import mongoose from 'mongoose'

const schema = new mongoose.Schema({

    user_id: { type: String, required: true },
    rider_id: { type: String },
    category_id: { type: String, required: true },

    receipt_point: { type: String, required: true },
    delivery_point: { type: String, required: true },
    time: { type: String, required: true },
    desc: { type: String, default: '' },
    price: { type: Number, required: true },

    is_completed: { type: Boolean, default: false },

    calls: { type: Array },


}, { versionKey: false, timestamps: true })

export default mongoose.model("loading_trips", schema);
