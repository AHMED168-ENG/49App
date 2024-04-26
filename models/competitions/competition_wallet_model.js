import mongoose, { Mongoose } from "mongoose";

const schema = new mongoose.Schema(
  {
    subscriber_id: {
      type: Mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "subscribers",
    },
    competition_id: {
      type: Mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "competitions",
    },
    amount: { type: Number, required: true, default: 0 },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("competition_wallet", schema);