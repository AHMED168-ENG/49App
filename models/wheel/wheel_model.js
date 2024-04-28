import mongoose from "mongoose";

const wheelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    pricePerPoint: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("wheels", wheelSchema);
