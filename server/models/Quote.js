import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema(
  {
    quoteId: { type: String, unique: true, sparse: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    modelName: { type: String, required: true },
    material: { type: String, default: "PLA" },
    quantity: { type: Number, default: 1 },
    estimatedPrice: { type: Number, default: 0 },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" }
  },
  { timestamps: true }
);

quoteSchema.pre("save", function (next) {
  if (!this.quoteId) {
    this.quoteId = `QT-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  next();
});

export default mongoose.model("Quote", quoteSchema);
