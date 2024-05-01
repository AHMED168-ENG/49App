import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    blocked: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    privacyFriendRequest: { type: Boolean, default: true },
    privacyFollowRequest: { type: Boolean, default: true },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("profiles", ProfileSchema);
