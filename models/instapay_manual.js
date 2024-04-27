import mongoose from 'mongoose'


const schema = new mongoose.Schema({

    user_id: { type: mongoose.Schema.Types.ObjectId , required: true , ref : "users" },
    image_reset: { type: String, required: true },
    approved : { type: Boolean , default : false },
    main_category_id: { type: String , ref : "main_categories"},
    sub_category_id: { type: String , ref : "main_categories"},
}, { versionKey: false, timestamps: true })

export default mongoose.model("instapay_manual", schema);