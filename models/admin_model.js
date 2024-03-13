import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },

}, { versionKey: false, timestamps: true })

export default mongoose.model("admins", schema);