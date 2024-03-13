import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    owner_id: { type: String, required: true },
    user_id: { type: String, required: true },

    type: { type: Number, required: true },
    category_id: { type: String },
    background: { type: String },
    name: { type: String },

    is_archived: { type: Boolean, default: false, required: true },
}, { versionKey: false, timestamps: true })

/*

1- user
2- group

*/
export default mongoose.model("chat_contacts", schema);