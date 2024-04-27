import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2';


const schema = new mongoose.Schema({
    reason: { type: String, required: true },
    according: { type: Boolean, required: true }, //  true mean client false mean rider
    type : {type: Number, required: true , default : 1}
}, { versionKey: false, timestamps: true })


schema.plugin(mongoosePaginate);            

export default mongoose.model("cancelation_reasons", schema);