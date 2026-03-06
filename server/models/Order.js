import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: String, unique: true, sparse: true },
  customerName: { type: String, default: "Customer" },
  customerEmail: { type: String, default: "" },
  customerPhone: { type: String, default: "" },
  modelName: { type: String, default: "Untitled Model" },
  material: { type: String, default: "PLA" },
  quantity: { type: Number, default: 1 },
  weight: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  pricingBreakdown: {
    materialRate: { type: Number, default: 0 },
    materialCost: { type: Number, default: 0 },
    postProcessing: {
      sanding: { type: Boolean, default: false },
      primerPainting: { type: Boolean, default: false },
      supportRemoval: { type: Boolean, default: false }
    },
    postProcessingCost: { type: Number, default: 0 },
    shipping: {
      fullName: { type: String, default: "" },
      streetAddress: { type: String, default: "" },
      city: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      method: { type: String, enum: ["standard", "express"], default: "standard" }
    },
    shippingCost: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0.088 },
    tax: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    paymentOption: { type: String, enum: ["online", "cod"], default: "online" },
    payableNow: { type: Number, default: 0 },
    dueOnDelivery: { type: Number, default: 0 }
  },
  paymentStatus: { type: String, enum: ["Unpaid", "Partially Paid", "Paid", "Refunded"], default: "Unpaid" },
  status: { type: String, enum: ["Pending", "Printing", "Completed", "Cancelled"], default: "Pending" },
  assignedPrinter: { type: String, default: "" },
  fileName: { type: String, default: "" },
  fileSize: { type: Number, default: 0 }
}, { timestamps: true });

orderSchema.pre("save", function () {
  if (!this.orderId) {
    this.orderId = `NX-${Math.floor(100000 + Math.random() * 900000)}`;
  }
});

export default mongoose.model("Order", orderSchema);
