import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2';


const schema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId , ref : "users" , required : true }, 
    auction_id: { type: mongoose.Schema.Types.ObjectId , ref : "auction" , required : true },
    price : { type: Number , default : 0 },
    is_accepted: { type: Boolean , required : true , default : false}
}, { versionKey: false, timestamps: true })

schema.plugin(mongoosePaginate);
export default mongoose.model("user_auction", schema);