import mongoose from 'mongoose'


const schema = new mongoose.Schema({

    user_id: { type: String, required: true },
    reporter_id: { type: String, required: true },
    reason: { type: String },

    type: { type: Number, required: true, },
    content: { type: String, required: true, },

    nudity: { type: Boolean, default: false },
    frequent: { type: Boolean, default: false },
    fake: { type: Boolean, default: false },
    abuse: { type: Boolean, default: false },
    hated: { type: Boolean, default: false },
    illegal: { type: Boolean, default: false },
    another: { type: Boolean, default: false },



    /*
    Types

    1- profile
    2- post
    3- storyOrReel
    4- dynamicAd
    5- tinder 
    5- newRide 
    
    */
    


}, { versionKey: false, timestamps: true })

export default mongoose.model("reprots", schema);
