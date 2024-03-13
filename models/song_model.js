import mongoose from 'mongoose'


const schema = new mongoose.Schema({

    name: { type: String, required: true },
    play_url: { type: String, required: true },
    thumb_url: { type: String },
    duration: { type: Number, required: true },
    times: { type: Number, default: 0 },

    owner_id: { type: String, },

}, { versionKey: false, timestamps: true })

export default mongoose.model("songs", schema);
