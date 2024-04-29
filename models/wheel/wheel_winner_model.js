import mongoose from "mongoose";

const wheelWinnerSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    wheel_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    profit: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    is_paid: { type: Boolean, default: false },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("wheelWinner", wheelWinnerSchema);
