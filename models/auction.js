import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2';


const schema = new mongoose.Schema({
    name : { type: String , required : true },
    user_id: { type: mongoose.Schema.Types.ObjectId , ref : "users" , required : true }, // this field according to user that add auction
    start_price : { type: Number , default : 0 }, // this field according to start price for auction
    is_finished: { type: Boolean , required : true , default : false} , // this field according to if auction stop and finish from owner or not
    end_at : { type: Date , default : null},
    is_approved : { type: Boolean , default : false},
    sup_category : { type: mongoose.Schema.Types.ObjectId , ref : "sub_categories" , default : false},
    main_category : { type: mongoose.Schema.Types.ObjectId , ref : "main_categories" , default : false},
    small_price : { type: Number},
    need_price : { type: Number},
    ad_id : {type: mongoose.Schema.Types.ObjectId , ref : "dynamic_ads" , required : true}
}, { versionKey : false , timestamps : true })

schema.plugin(mongoosePaginate);
export default mongoose.model("auction", schema);

