import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    user_id: { type: String, required: true },
    category_id: { type: String, required: true },
    restaurant_id: { type: String, required: true, },
    items: { type: Array, required: true, },

}, { versionKey: false, timestamps: true })

export default mongoose.model("food_orders", schema);
