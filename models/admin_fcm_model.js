import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    fcm: { type: String, required: true, unique: true },
}, { versionKey: false, timestamps: true })

export default mongoose.model("admin_fcm", schema);