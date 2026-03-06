import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    adminName: { type: String, default: "Admin" },
    message: { type: String, required: true },
    emailSent: { type: Boolean, default: false },
    whatsappSent: { type: Boolean, default: false },
    emailError: { type: String, default: "" },
    whatsappError: { type: String, default: "" }
  },
  { timestamps: true }
);

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: "application/octet-stream" },
    url: { type: String, required: true }
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    customerCode: { type: String, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    subject: { type: String, default: "General Inquiry" },
    message: { type: String, required: true },
    attachment: { type: attachmentSchema, default: null },
    status: { type: String, enum: ["Open", "Replied", "Closed"], default: "Open" },
    replies: [replySchema]
  },
  { timestamps: true }
);

contactSchema.pre("save", function () {
  if (!this.customerCode) {
    const base = (this.name || "CUS").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 3) || "CUS";
    const suffix = Math.floor(1000 + Math.random() * 9000);
    this.customerCode = `${base}-${suffix}`;
  }
});

export default mongoose.model("Contact", contactSchema);
