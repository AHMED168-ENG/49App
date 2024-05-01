import mongoose from "mongoose";

const FollowersSchema = new mongoose.Schema(
  {
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    follower_id: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "users",
      },
    ],
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("followers", FollowersSchema);
