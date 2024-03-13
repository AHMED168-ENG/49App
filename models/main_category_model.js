import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    name_ar: { type: String, required: true },
    name_en: { type: String, required: true },
    is_hidden: { type: Boolean, default: false },
    banner: { type: String, required: true },
    cover: { type: String, required: true },

    index: { type: Number, required: true },
}, { versionKey: false, timestamps: true })

export default mongoose.model("main_categories", schema);
