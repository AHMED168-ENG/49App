import mongoose from 'mongoose'

const schema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId , required: true , ref : "users"},
}, { versionKey: false, timestamps: true })

export default mongoose.model("ride_request_logs", schema);
