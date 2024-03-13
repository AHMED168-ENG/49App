import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    category_id: { type: String, required: true },

    restaurant_id: { type: String, required: true, },

    name: { type: String, required: true, },
    desc: { type: String, required: true },
    price: { type: Number, required: true },

    picture: { type: String },

    is_approved: { type: Boolean, default: false },


}, { versionKey: false, timestamps: true })

export default mongoose.model("foods", schema);
