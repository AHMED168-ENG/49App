import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    user_id: { type: String, required: true },
    category_id: { type: String, required: true },
    doctor_id: { type: String, required: true, },
    book_time: { type: String, required: true },

}, { versionKey: false, timestamps: true })

export default mongoose.model("patient_books", schema);
