import mongoose from "mongoose";

const printerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    type: { type: String, default: "FDM" },
    status: {
      type: String,
      enum: ["Idle", "Printing", "Maintenance"],
      default: "Idle"
    },
    location: { type: String, default: "Floor A" }
  },
  { timestamps: true }
);

export default mongoose.model("Printer", printerSchema);
