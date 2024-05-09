import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2';


const schema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId , ref : "users" , required : true },
    start_price : { type: Number , default : 0 , required : true }, 
    installment_id : {type: mongoose.Schema.Types.ObjectId , ref : "installments" , required : true},
    number_months: { type: Number , required : true , required : true} ,
    financial_payment : { type: Number , required : true},
    is_approved : { type: Boolean , default : false},    
}, { versionKey : false , timestamps : true })


schema.plugin(mongoosePaginate);
export default mongoose.model("user_installment", schema);