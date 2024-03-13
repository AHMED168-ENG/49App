import mongoose from 'mongoose'

const schema = new mongoose.Schema({

    user_id: { type: String, required: true },
    rider_id: { type: String },
    category_id: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    distance: { type: String, required: true },
    time: { type: String, required: true },
    price: { type: Number, required: true },

    user_lat: { type: Number, required: true },
    user_lng: { type: Number, required: true },

    rider_lat: { type: Number },
    rider_lng: { type: Number },

    destination_lat: { type: Number, required: true },
    destination_lng: { type: Number, required: true },

    is_start: { type: Boolean, default: false },
    is_completed: { type: Boolean, default: false },
    is_canceled: { type: Boolean, default: false },

    passengers: { type: Number, default: 0 },

    is_user_get_cashback: { type: Boolean, default: false },
    is_rider_get_cashback: { type: Boolean, default: false },
    phone : {type:String},
    

}, { versionKey: false, timestamps: true })

export default mongoose.model("rides", schema);
