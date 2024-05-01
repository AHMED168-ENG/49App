import mongoose from 'mongoose'


const schema = new mongoose.Schema({

    user_rating_id: { type: mongoose.Schema.Types.ObjectId, required: true , ref : "users" },
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true , ref : "users" },
    category_id: { type: mongoose.Schema.Types.ObjectId, required: true , ref : "sub_categories" },
    request_id: { type: mongoose.Schema.Types.ObjectId, required: true , ref : "rides" },
    ad_id: {type : String },
    comment: { type: String, default: '' },
    field_one: { type: Number, default: 0 },
    field_two: { type: Number, default: 0 },
    field_three: { type: Number, default: 0 },
    field_four: { type: Number, default: 0 },
    field_five: { type: Number, default: 0 },
}, { versionKey: false, timestamps: true })

export default mongoose.model("ad_ratings", schema);
