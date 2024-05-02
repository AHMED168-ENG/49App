import mongoose from "mongoose";

const wheelSchema = new mongoose.Schema(
  {
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "wheelItems",
      },
    ],
    name: { type: String, required: true, unique: true },
    // 10,000 points = 10$
    pricePerPoint: { type: Number, default: 0.001 },
    isActive: { type: Boolean, default: true },
    limit: { type: mongoose.Schema.Types.ObjectId, ref: "wheellimits"}
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("wheels", wheelSchema);
