import mongoose from "mongoose";

const FollowingsSchema = new mongoose.Schema(
  {
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    following_id: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "users",
      },
    ],
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("followings", FollowingsSchema);
