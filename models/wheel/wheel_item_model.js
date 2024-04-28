import mongoose from "mongoose";

const wheelItemSchema = new mongoose.Schema(
  {
    wheel_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "wheels",
    },
    name: { type: String, required: true },
    value: { type: Number, required: true },
    type: { type: ["point", "money"] },
    percentage: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("wheelItems", wheelItemSchema);
