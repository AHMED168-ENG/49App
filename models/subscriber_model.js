import mongoose, { Mongoose } from "mongoose";

const schema = new mongoose.Schema(
  {
    user_id: {
      type: Mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    compition_id: {
      type: Mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "compitions",
    },
    isBlocked: { type: Boolean, default: false },
    isFraud: { type: Boolean, default: false },
    countOfRequest: { type: Number, default: 0 },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("subscribers", schema);
