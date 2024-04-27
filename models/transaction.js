import mongoose from 'mongoose'

const schema = new mongoose.Schema({

    user_id: { type: String, required: true },
    referent_id: { type: String, required: true },
    url :  { type: String, required: true },
    pay_way : { type: String, required: true }
}, { versionKey: false, timestamps: true })

export default mongoose.model("transaction", schema);
