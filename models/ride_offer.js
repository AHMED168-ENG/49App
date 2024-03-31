import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const schema = new mongoose.Schema({
    to : { type: mongoose.Schema.Types.ObjectId, required: true , ref : "users" },
    from : { type: mongoose.Schema.Types.ObjectId, required: true , ref : "users" },
    price_offer: { type: Number, default: false },
    ride_id : {type: mongoose.Schema.Types.ObjectId, required: true , ref : "rides" },
    is_accept : {type : Boolean , default : false}
}, { versionKey: false, timestamps: true })

schema.plugin(mongooseAggregatePaginate);
schema.plugin(mongoosePaginate);            
export default mongoose.model("ride_offer", schema);
