import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import contactRoutes from "./routes/contact.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payment.js";
import uploadRoutes from "./routes/upload.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nexus3d";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173,http://localhost:3000";
const allowedOrigins = FRONTEND_ORIGIN.split(",").map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/upload", uploadRoutes);

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
