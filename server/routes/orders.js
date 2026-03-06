import express from "express";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const { material, quantity, weight, price, modelName, fileName, fileSize } = req.body;
  const user = await User.findById(req.user.id).select("name email");

  const order = await Order.create({
    user: req.user.id,
    customerName: user?.name || user?.email || "Customer",
    customerEmail: user?.email || "",
    modelName: modelName || "Uploaded Model",
    material,
    quantity,
    weight,
    price,
    fileName: fileName || "",
    fileSize: fileSize || 0
  });

  await Notification.create({
    title: "New order received",
    message: `${order.orderId} created by ${order.customerName}`
  });

  res.json(order);
});

router.get("/my-orders", authMiddleware, async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
});

export default router;
