import mongoose from "mongoose";

const wheelLimitSchema = new mongoose.Schema(
  {
    maxCount: { type: Number, default: 0 },
  },
  { versionKey: false, timestamps: true }
);
export default mongoose.model("wheellimits", wheelLimitSchema);