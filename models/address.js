import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';


const schema = new mongoose.Schema({

    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId , required: true , ref:"users" },

}, { versionKey: false, timestamps: true })


schema.plugin(mongoosePaginate);
schema.plugin(mongooseAggregatePaginate);
export default mongoose.model("address", schema);
