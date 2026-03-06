import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    comment: { type: String, default: "" },
    orderId: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);
