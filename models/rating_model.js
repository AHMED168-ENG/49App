import mongoose from 'mongoose'


const schema = new mongoose.Schema({

    user_rating_id: { type: mongoose.Schema.Types.ObjectId, required: true , ref : "users" },
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true , ref : "users" },
    category_id: { type: mongoose.Schema.Types.ObjectId, required: true , ref : "sub_categories" },
    request_id: { type: mongoose.Schema.Types.ObjectId, required: true , ref : "rides" },
    comment: { type: String, default: '' },
    rate: { type: Number, default: 1 },
}, { versionKey: false, timestamps: true })

export default mongoose.model("ad_ratings", schema);
