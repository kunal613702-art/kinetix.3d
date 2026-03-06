import express from "express";
import Material from "../models/Material.js";
import Notification from "../models/Notification.js";
import Order from "../models/Order.js";
import PricingSetting from "../models/PricingSetting.js";
import Printer from "../models/Printer.js";
import Quote from "../models/Quote.js";
import Review from "../models/Review.js";
import SupportTicket from "../models/SupportTicket.js";
import UploadModel from "../models/UploadModel.js";
import User from "../models/User.js";

const router = express.Router();

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function normalizeOrder(orderDoc) {
  const order = typeof orderDoc.toObject === "function" ? orderDoc.toObject() : orderDoc;
  const userDoc = order.user && typeof order.user === "object" ? order.user : null;

  const fallbackNameFromEmail = userDoc?.email?.split("@")[0] || "Customer";
  const normalizedUserName =
    userDoc?.name && userDoc.name !== "User" ? userDoc.name : fallbackNameFromEmail;

  const customerName =
    order.customerName && !["Customer", "User"].includes(order.customerName)
      ? order.customerName
      : normalizedUserName;

  const customerId = userDoc?._id ? String(userDoc._id) : order.user ? String(order.user) : "";
  const customerCode = customerId ? `CUS-${customerId.slice(-6).toUpperCase()}` : "CUS-NA";

  return {
    ...order,
    customerName,
    customerId,
    customerCode
  };
}

async function seedInitialData() {
  if ((await Printer.countDocuments()) === 0) {
    await Printer.insertMany([
      { name: "Prusa MK4 - A1", type: "FDM", status: "Printing", location: "Bay 1" },
      { name: "Bambu X1C - C3", type: "FDM", status: "Printing", location: "Bay 2" },
      { name: "Elegoo Saturn - R1", type: "SLA", status: "Idle", location: "Bay 3" },
      { name: "Ender S1 - B2", type: "FDM", status: "Maintenance", location: "Bay 4" }
    ]);
  }

  if ((await Material.countDocuments()) === 0) {
    await Material.insertMany([
      { name: "PLA", pricePerGram: 2.5, stockGrams: 200000 },
      { name: "ABS", pricePerGram: 3.1, stockGrams: 140000 },
      { name: "PETG", pricePerGram: 3.4, stockGrams: 120000 },
      { name: "Resin", pricePerGram: 4.2, stockGrams: 90000 }
    ]);
  }

  if ((await PricingSetting.countDocuments()) === 0) {
    await PricingSetting.create({ pricePerGram: 2.8, machineCost: 50, shippingCost: 80 });
  }

  if ((await Review.countDocuments()) === 0) {
    await Review.insertMany([
      { userName: "Arjun Mehta", rating: 5, comment: "Excellent finish and support." },
      { userName: "Isha Verma", rating: 4, comment: "Fast delivery and great quality." }
    ]);
  }

  if ((await SupportTicket.countDocuments()) === 0) {
    await SupportTicket.insertMany([
      { customerName: "Bluepeak Labs", subject: "Need invoice correction", priority: "High", status: "Open" },
      { customerName: "Sara Khan", subject: "Model orientation issue", priority: "Medium", status: "In Progress" }
    ]);
  }

  if ((await Quote.countDocuments()) === 0) {
    await Quote.insertMany([
      {
        customerName: "Mia Thomas",
        customerEmail: "mia@example.com",
        modelName: "Architectural Mini",
        material: "PLA",
        quantity: 3,
        estimatedPrice: 188.35
      },
      {
        customerName: "Kunal Raj",
        customerEmail: "kunal@example.com",
        modelName: "Engine Mount",
        material: "ABS",
        quantity: 1,
        estimatedPrice: 94.99
      }
    ]);
  }
}

router.get("/bootstrap", async (req, res) => {
  try {
    await seedInitialData();
    res.json({ message: "Admin data ready" });
  } catch (error) {
    res.status(500).json({ message: "Bootstrap failed", error: error.message });
  }
});

router.get("/summary", async (req, res) => {
  try {
    await seedInitialData();

    const [orders, users, printers, materials, notifications, tickets, reviews, quotes, pricing] = await Promise.all([
      Order.find().populate("user", "name email").sort({ createdAt: -1 }).limit(100),
      User.find().select("name email createdAt"),
      Printer.find().sort({ createdAt: -1 }),
      Material.find().sort({ createdAt: -1 }),
      Notification.find().sort({ createdAt: -1 }).limit(10),
      SupportTicket.find().sort({ createdAt: -1 }).limit(10),
      Review.find().sort({ createdAt: -1 }).limit(10),
      Quote.find().sort({ createdAt: -1 }).limit(10),
      PricingSetting.findOne().sort({ createdAt: -1 })
    ]);

    const normalizedOrders = orders.map(normalizeOrder);

    const totalOrders = normalizedOrders.length;
    const totalRevenue = normalizedOrders.reduce((sum, order) => sum + (order.price || 0), 0);
    const activePrinters = printers.filter((printer) => printer.status === "Printing").length;
    const paidOrders = normalizedOrders.filter((order) => order.paymentStatus === "Paid").length;
    const conversionRate = totalOrders ? Number(((paidOrders / totalOrders) * 100).toFixed(1)) : 0;
    const averageOrderValue = totalOrders ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

    const monthlyMap = new Map(monthLabels.map((label) => [label, { month: label, orders: 0, revenue: 0 }]));
    for (const order of normalizedOrders) {
      const date = order.createdAt ? new Date(order.createdAt) : null;
      if (!date || Number.isNaN(date.getTime())) continue;
      const label = monthLabels[date.getMonth()];
      const target = monthlyMap.get(label);
      target.orders += 1;
      target.revenue += order.price || 0;
    }
    const monthlyAnalytics = Array.from(monthlyMap.values());

    const materialMap = new Map();
    for (const order of normalizedOrders) {
      const key = order.material || "Unknown";
      materialMap.set(key, (materialMap.get(key) || 0) + 1);
    }
    const popularMaterials = Array.from(materialMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const userSpendMap = new Map();
    for (const order of normalizedOrders) {
      const key = order.customerName || "Customer";
      userSpendMap.set(key, (userSpendMap.get(key) || 0) + (order.price || 0));
    }
    const topCustomers = Array.from(userSpendMap.entries())
      .map(([name, spend]) => ({ name, spend: Number(spend.toFixed(2)) }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);

    const customers = users.map((user) => {
      const userOrders = normalizedOrders.filter((order) => String(order.customerId) === String(user._id));
      const spend = userOrders.reduce((sum, order) => sum + (order.price || 0), 0);
      const customerName = user.name && user.name !== "User" ? user.name : user.email.split("@")[0];
      return {
        id: user._id,
        customerCode: `CUS-${String(user._id).slice(-6).toUpperCase()}`,
        name: customerName,
        email: user.email,
        orders: userOrders.length,
        spend: Number(spend.toFixed(2))
      };
    });

    res.json({
      kpis: {
        totalOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        activePrinters,
        conversionRate,
        averageOrderValue
      },
      monthlyAnalytics,
      orders: normalizedOrders,
      printers,
      materials,
      topCustomers,
      popularMaterials,
      customers,
      notifications,
      tickets,
      reviews,
      quotes,
      pricing
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load summary", error: error.message });
  }
});

router.get("/orders", async (req, res) => {
  const { status = "All", search = "" } = req.query;
  const query = {};
  if (status !== "All") query.status = status;
  if (search) {
    query.$or = [
      { orderId: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
      { modelName: { $regex: search, $options: "i" } }
    ];
  }
  const data = await Order.find(query).populate("user", "name email").sort({ createdAt: -1 });
  res.json(data.map(normalizeOrder));
});

router.get("/customers/:id/details", async (req, res) => {
  const user = await User.findById(req.params.id).select("name email createdAt");
  if (!user) return res.status(404).json({ message: "Customer not found" });

  const userName = user.name && user.name !== "User" ? user.name : user.email.split("@")[0];
  const customerCode = `CUS-${String(user._id).slice(-6).toUpperCase()}`;

  const [ordersRaw, uploads, quotes, tickets, reviews] = await Promise.all([
    Order.find({ user: user._id }).populate("user", "name email").sort({ createdAt: -1 }),
    UploadModel.find({ user: user._id }).sort({ createdAt: -1 }),
    Quote.find({
      $or: [{ customerEmail: user.email }, { customerName: userName }]
    }).sort({ createdAt: -1 }),
    SupportTicket.find({ customerName: userName }).sort({ createdAt: -1 }),
    Review.find({ userName }).sort({ createdAt: -1 })
  ]);

  const orders = ordersRaw.map(normalizeOrder);
  const totalSpent = orders.reduce((sum, order) => sum + (order.price || 0), 0);

  res.json({
    customer: {
      id: user._id,
      customerCode,
      name: userName,
      email: user.email,
      joinedAt: user.createdAt
    },
    stats: {
      totalOrders: orders.length,
      totalSpent: Number(totalSpent.toFixed(2)),
      activeOrders: orders.filter((o) => o.status === "Pending" || o.status === "Printing").length,
      completedOrders: orders.filter((o) => o.status === "Completed").length
    },
    orders,
    uploads,
    quotes,
    tickets,
    reviews
  });
});

router.patch("/orders/:id", async (req, res) => {
  const { status, assignedPrinter, paymentStatus } = req.body;
  const update = {};
  if (status) update.status = status;
  if (typeof assignedPrinter === "string") update.assignedPrinter = assignedPrinter;
  if (paymentStatus) update.paymentStatus = paymentStatus;
  const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});

router.get("/uploads", async (req, res) => {
  const uploads = await UploadModel.find().sort({ createdAt: -1 });
  res.json(uploads);
});

router.patch("/uploads/:id", async (req, res) => {
  const upload = await UploadModel.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!upload) return res.status(404).json({ message: "Upload not found" });
  res.json(upload);
});

router.get("/printers", async (req, res) => {
  const printers = await Printer.find().sort({ createdAt: -1 });
  res.json(printers);
});

router.post("/printers", async (req, res) => {
  const { name, type, status, location } = req.body;
  const printer = await Printer.create({ name, type, status, location });
  res.status(201).json(printer);
});

router.patch("/printers/:id", async (req, res) => {
  const printer = await Printer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!printer) return res.status(404).json({ message: "Printer not found" });
  res.json(printer);
});

router.get("/materials", async (req, res) => {
  const materials = await Material.find().sort({ createdAt: -1 });
  res.json(materials);
});

router.post("/materials", async (req, res) => {
  const material = await Material.create(req.body);
  res.status(201).json(material);
});

router.patch("/materials/:id", async (req, res) => {
  const material = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!material) return res.status(404).json({ message: "Material not found" });
  res.json(material);
});

router.get("/quotes", async (req, res) => {
  const quotes = await Quote.find().sort({ createdAt: -1 });
  res.json(quotes);
});

router.post("/quotes", async (req, res) => {
  const quote = await Quote.create(req.body);
  res.status(201).json(quote);
});

router.patch("/quotes/:id", async (req, res) => {
  const quote = await Quote.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!quote) return res.status(404).json({ message: "Quote not found" });
  res.json(quote);
});

router.get("/tickets", async (req, res) => {
  const tickets = await SupportTicket.find().sort({ createdAt: -1 });
  res.json(tickets);
});

router.post("/tickets", async (req, res) => {
  const ticket = await SupportTicket.create(req.body);
  res.status(201).json(ticket);
});

router.patch("/tickets/:id", async (req, res) => {
  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  res.json(ticket);
});

router.get("/reviews", async (req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 });
  res.json(reviews);
});

router.post("/reviews", async (req, res) => {
  const review = await Review.create(req.body);
  res.status(201).json(review);
});

router.get("/pricing", async (req, res) => {
  let pricing = await PricingSetting.findOne().sort({ createdAt: -1 });
  if (!pricing) pricing = await PricingSetting.create({});
  res.json(pricing);
});

router.put("/pricing", async (req, res) => {
  let pricing = await PricingSetting.findOne().sort({ createdAt: -1 });
  if (!pricing) {
    pricing = await PricingSetting.create(req.body);
  } else {
    pricing.pricePerGram = req.body.pricePerGram ?? pricing.pricePerGram;
    pricing.machineCost = req.body.machineCost ?? pricing.machineCost;
    pricing.shippingCost = req.body.shippingCost ?? pricing.shippingCost;
    await pricing.save();
  }
  res.json(pricing);
});

router.get("/notifications", async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(20);
  res.json(notifications);
});

router.post("/notifications", async (req, res) => {
  const notification = await Notification.create(req.body);
  res.status(201).json(notification);
});

router.patch("/notifications/:id/read", async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { read: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: "Notification not found" });
  res.json(notification);
});

export default router;
