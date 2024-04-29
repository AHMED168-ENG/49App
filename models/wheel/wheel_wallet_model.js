import mongoose from "mongoose";

const wheelWalletSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    amount: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("wheelWallets", wheelWalletSchema);
