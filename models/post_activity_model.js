import mongoose from 'mongoose'


const schema = new mongoose.Schema({

    name_ar: { type: String, required: true },
    name_en: { type: String, required: true },
    picture: { type: String },

}, { versionKey: false, timestamps: true })

export default mongoose.model("post_activities", schema);
