import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    user_id: { type: String, required: true },
    caller_id: { type: String, required: true },
    is_video: { type: Boolean, required: true },
    is_accept: { type: Boolean, required: true },
}, { versionKey: false, timestamps: true })

export default mongoose.model("chat_call_logs", schema);