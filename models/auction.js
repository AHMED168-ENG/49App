import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    user_id: { type: String , ref : "users" , required : true }, // this field according to user that add auction
    start_price : { type: Number , default : 0 }, // this field according to start price for auction
    price_update: { type: Date, required: true , default : Date.now() }, // this field according to price update
    last_price: { type: Date, required: true , default : 0 }, // this field according to last price
    is_finished: { type: Boolean , required : true , default : false}  // this field according to if auction stop and finish from owner or not
}, { versionKey: false, timestamps: true })

export default mongoose.model("auction", schema);