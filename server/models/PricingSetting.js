import mongoose from "mongoose";

const pricingSettingSchema = new mongoose.Schema(
  {
    pricePerGram: { type: Number, default: 2.5 },
    machineCost: { type: Number, default: 50 },
    shippingCost: { type: Number, default: 80 }
  },
  { timestamps: true }
);

export default mongoose.model("PricingSetting", pricingSettingSchema);
