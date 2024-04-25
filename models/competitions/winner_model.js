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
    user_id: {
      type: Mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    profit: { type: Number, required: true, default: 0 },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("competition_winner", schema);
