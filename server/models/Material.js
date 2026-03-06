import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    pricePerGram: { type: Number, required: true, default: 0 },
    stockGrams: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Material", materialSchema);
