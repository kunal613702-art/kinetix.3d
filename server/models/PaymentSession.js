import mongoose from "mongoose";

const paymentSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, unique: true, required: true },
    provider: { type: String, default: "simulated-provider" },
    paymentMethod: {
      type: String,
      enum: ["card", "bank", "qr"],
      default: "card"
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    qrPayload: { type: String, default: "" },
    status: {
      type: String,
      enum: ["created", "pending", "paid", "failed", "expired"],
      default: "created"
    },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("PaymentSession", paymentSessionSchema);
