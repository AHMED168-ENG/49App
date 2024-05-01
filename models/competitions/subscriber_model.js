import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    competition_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "competitions",
    },
    wallet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "competition_wallet",
    },
    isBlocked: { type: Boolean, default: false },
    isFraud: { type: Boolean, default: false },
    countOfRequest: { type: Number, default: 0 },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("subscribers", schema);
