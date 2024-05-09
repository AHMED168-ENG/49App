import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2';


const schema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId , ref : "users" , required : true },
    installment_id : {type: mongoose.Schema.Types.ObjectId , ref : "installments" , required : true},
    images : {
        type: [String],
    },
    
}, { versionKey : false , timestamps : true })


schema.plugin(mongoosePaginate);
export default mongoose.model("installmentsUserAssets", schema);