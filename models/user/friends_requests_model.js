import mongoose from "mongoose";

const FriendsRequestsSchema = new mongoose.Schema(
  {
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    receiver_Id: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "users",
      },
    ],
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("friends_requests", FriendsRequestsSchema);
