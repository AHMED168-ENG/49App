import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    user_id: { type: String },
    name: { type: String },
    phone: { type: String, required: true },
    description: { type: String, required: true },
    user: { type: Object },
}, { versionKey: false, timestamps: true })

export default mongoose.model("complaints", schema);