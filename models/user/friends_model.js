import mongoose from "mongoose";

const FriendsSchema = new mongoose.Schema(
  {
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    friend_id: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "users",
      },
    ],
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("friends", FriendsSchema);
