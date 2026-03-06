import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true, sparse: true },
    customerName: { type: String, required: true },
    subject: { type: String, required: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    status: { type: String, enum: ["Open", "In Progress", "Resolved"], default: "Open" }
  },
  { timestamps: true }
);

supportTicketSchema.pre("save", function (next) {
  if (!this.ticketId) {
    this.ticketId = `TK-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  next();
});

export default mongoose.model("SupportTicket", supportTicketSchema);
