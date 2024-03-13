import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    contact_id: { type: String, required: true },
    receiver_id: { type: String, required: true },
    text: { type: String },

    seen: { type: Array },
    sent: { type: Array },

    seen_auth: { type: Array }, // for single auth
    sent_auth: { type: Array }, // for single auth

    attachments: { type: Array },
    likes: { type: Array },
    love: { type: Array },
    wow: { type: Array },
    sad: { type: Array },
    angry: { type: Array },
    is_deleted: { type: Boolean },
    is_forward: { type: Boolean },
    replay_message: { type: Object },
    type: { type: Number, required: true }
}, { versionKey: false, timestamps: true })

export default mongoose.model("chat_messages", schema);