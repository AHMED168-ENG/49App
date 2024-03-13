import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    name: { type: String, required: true },
    picture: { type: String, required: true },
    owner_id: { type: String, required: true },
    members: { type: Array, required: true },
    admins: { type: Array },

    background: { type: String },

    only_admin_chat: { type: Boolean, default: false },
    only_admin_add_members: { type: Boolean, default: false },

}, { versionKey: false, timestamps: true })

export default mongoose.model("chat_groups", schema);