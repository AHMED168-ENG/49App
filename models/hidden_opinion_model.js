import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    user_id: { type: String, required: true },
    receiver_id: { type: String, required: true },
    is_male: { type: Boolean },
    text: { type: String, required: true },

}, { versionKey: false, timestamps: true })

export default mongoose.model("hidden_opinions", schema);