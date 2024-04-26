import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "main_categories",
      unique: true,
    },
    name: { type: String, required: true , unique: true},
    description: { type: String, required: true },
    maxSubscriber: { type: Number, required: true },
    withdrawLimit: { type: Number, required: true },
    status: { type: Boolean, required: true, default: true },
    start_date: { type: Date, default: null},
    end_date: { type: Date, default: null},
    pricePerRequest: { type: Number, required: true },
    currentSubscribers: { type: Number, default: 0 },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("competitions", schema);
