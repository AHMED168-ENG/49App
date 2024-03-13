import mongoose from 'mongoose'


const schema = new mongoose.Schema({

    user_id: { type: String },
    ad_id: { type: String, required: true },
    type: { type: Number, required: true },
    sub_category_id: { type: String },
}, { versionKey: false, timestamps: true })

export default mongoose.model("favorites", schema);
