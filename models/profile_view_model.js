import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    user_id: { type: String, required: true },
    owner_id: { type: String, required: true },
    times: { type: Number, default: 0 },
}, { versionKey: false, timestamps: true })

export default mongoose.model("profile_views", schema);