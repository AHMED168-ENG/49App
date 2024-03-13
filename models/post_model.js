import mongoose from 'mongoose'


const schema = new mongoose.Schema({

    user_id: { type: String, required: true },

    text: { type: String, default: '' },

    location: { type: String },
    feeling_id: { type: String },
    activity_id: { type: String },

    privacy: { type: Number, required: true },
    comment_privacy: { type: Number, default: 2 },

    likes: { type: Array, },
    love: { type: Array, },
    wow: { type: Array, },
    sad: { type: Array, },
    angry: { type: Array, },

    shares: { type: Array, },

    pictures: { type: Array },

    tags: { type: Array },

    background: { type: Number },
    travel_from: { type: String },
    travel_to: { type: String },
    
}, { versionKey: false, timestamps: true })

export default mongoose.model("posts", schema);
