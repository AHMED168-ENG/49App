import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    sub_category_id: { type: String, required: true },
    name_ar: { type: String, required: true },
    name_en: { type: String, required: true },
    type: { type: Number, required: true },
    index: { type: Number, required: true },

    selections: { type: Array },

    // Title > 0
    // Desc > 1
    // Pictures > 2

    // Text Field > 3
    // Drop Down > 4
    // Date Picker > 5
    // Day Picker > 6
    // Video Picker > 7
    // PDF Picker > 8
    // Check Box > 9


}, { versionKey: false, timestamps: true })

export default mongoose.model("dynamic_props", schema);