import mongoose from 'mongoose'


const schema = new mongoose.Schema({

    user_rating_id: { type: String, required: true },

    user_id: { type: String, required: true },

    category_id: { type: String, required: true },
    ad_id: { type: String, required: true },

    field_one: { type: Number, default: 5 },
    field_two: { type: Number, default: 5 },
    field_three: { type: Number, default: 5 },
    comment: { type: String, default: '' },


}, { versionKey: false, timestamps: true })

export default mongoose.model("ad_ratings", schema);
