import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const schema = new mongoose.Schema({

    user_id: { type: mongoose.Schema.ObjectId, required: true , ref : "users" },
    rider_id: { type: mongoose.Schema.ObjectId , ref : "riders" },
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

    location: { type: Object, default: { type: "Point", coordinates: [0, 0] } },

    is_start: { type: Boolean, default: false },
    is_completed: { type: Boolean, default: false },
    is_canceled: { type: Boolean, default: false },

    passengers: { type: Number, default: 0 },

    is_user_get_cashback : { type: Boolean, default: false },
    is_rider_get_cashback: { type: Boolean, default: false },
    phone : {type:String},
    

}, { versionKey: false, timestamps: true })

schema.index({
    location: "2dsphere",
})
schema.plugin(mongoosePaginate);
schema.plugin(mongooseAggregatePaginate);
export default mongoose.model("rides", schema);
