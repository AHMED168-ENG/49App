import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    viewer_id: { type: String, required: true },
    user_id:{type:String,required:true},
    viewed_at:{type:Date,required:true}
}, { versionKey: false, timestamps: true })

/*

1- user
2- group

*/
export default mongoose.model("contact_seen_log", schema);