import mongoose from 'mongoose'

const schema = new mongoose.Schema({

    user_id: { type: mongoose.Schema.Types.ObjectId , ref : "users" , required : true  },

    sub_category_id : { type: mongoose.Schema.Types.ObjectId , ref : "sub_categories" , default : false},
    
    is_premium: { type: Boolean, required : true },

    days: { type: Number, required: true },

    is_active: { type: Boolean, default : false },
    
}, { versionKey: false, timestamps: true })

export default mongoose.model("subscriptions", schema);
