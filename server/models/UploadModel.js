import mongoose from "mongoose";

const uploadModelSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    uploadedBy: { type: String, default: "User" },
    modelName: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    material: { type: String, default: "PLA" },
    status: { type: String, enum: ["Uploaded", "Validated", "Rejected"], default: "Uploaded" }
  },
  { timestamps: true }
);

export default mongoose.model("UploadModel", uploadModelSchema);
