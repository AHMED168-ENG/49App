import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "main_categories",
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    maxSubscriber: { type: Number, required: true },
    withdrawLimit: { type: Number, required: true },
    status: { type: Boolean, required: true, default: true }, // active, inactive
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    pricePerRequest: { type: Number, required: true },
    currentSubscribers: { type: Number, default: 0 },
  },
  { versionKey: false, timestamps: true }
);

schema.virtual('duration').get(function() {
  if (!this.start_date || !this.end_date) {
      return null; // or any default value you prefer
  }

  const start = this.start_date.getTime();
  const end = this.end_date.getTime();
  const durationInMilliseconds = end - start;

  // Calculate duration in days, hours, and minutes
  const days = Math.floor(durationInMilliseconds / (1000 * 60 * 60 * 24));
  const hours = Math.floor((durationInMilliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((durationInMilliseconds % (1000 * 60 * 60)) / (1000 * 60));

  // Format the duration as "days:hours:minutes"
  const formattedDuration = `${days}:${hours}:${minutes}`;

  return formattedDuration;
});
export default mongoose.model("competitions", schema);
