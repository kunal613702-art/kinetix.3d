import crypto from "node:crypto";
import express from "express";
import nodemailer from "nodemailer";
import twilio from "twilio";
import authMiddleware from "../middleware/authMiddleware.js";
import Notification from "../models/Notification.js";
import Order from "../models/Order.js";
import PaymentSession from "../models/PaymentSession.js";
import User from "../models/User.js";

const router = express.Router();

const MATERIAL_RATES = {
  PLA: 2.0,
  ABS: 2.5,
  PETG: 2.8,
  TPU: 3.2
};

const POST_PROCESSING_COSTS = {
  sanding: 35,
  primerPainting: 120,
  supportRemoval: 25
};

const SHIPPING_COSTS = {
  standard: 60,
  express: 180
};

const QUANTITY_DISCOUNT_THRESHOLD = 5;
const QUANTITY_DISCOUNT_RATE = 0.05;
const TAX_RATE = 0.088;
const COD_ADVANCE_RATE = 0.01;

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function getPricingFromDraft(orderDraft = {}) {
  const material = String(orderDraft.material || "").toUpperCase();
  const quantity = Number(orderDraft.quantity || 0);
  const weight = Number(orderDraft.weight || 0);
  const selectedRate = MATERIAL_RATES[material];

  if (!selectedRate) {
    throw new Error("Invalid material selected");
  }
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const postProcessing = {
    sanding: Boolean(orderDraft?.postProcessing?.sanding),
    primerPainting: Boolean(orderDraft?.postProcessing?.primerPainting),
    supportRemoval: Boolean(orderDraft?.postProcessing?.supportRemoval)
  };

  const shippingMethod = ["standard", "express"].includes(orderDraft?.shipping?.method)
    ? orderDraft.shipping.method
    : "standard";
  const paymentOption = orderDraft?.paymentOption === "cod" ? "cod" : "online";
  const shippingCost = SHIPPING_COSTS[shippingMethod];
  const chargeableUnits = weight > 0 ? weight : quantity;

  const materialCost = round2(chargeableUnits * selectedRate);
  const postProcessingCost = round2(
    (postProcessing.sanding ? POST_PROCESSING_COSTS.sanding : 0) +
    (postProcessing.primerPainting ? POST_PROCESSING_COSTS.primerPainting : 0) +
    (postProcessing.supportRemoval ? POST_PROCESSING_COSTS.supportRemoval : 0)
  );

  const subtotal = round2(materialCost + postProcessingCost + shippingCost);
  const discount = quantity >= QUANTITY_DISCOUNT_THRESHOLD ? round2(subtotal * QUANTITY_DISCOUNT_RATE) : 0;
  const taxableAmount = round2(subtotal - discount);
  const tax = round2(taxableAmount * TAX_RATE);
  const total = round2(taxableAmount + tax);
  const payableNow = paymentOption === "cod" ? round2(total * COD_ADVANCE_RATE) : total;
  const dueOnDelivery = round2(total - payableNow);

  return {
    material,
    quantity,
    weight: round2(weight),
    materialRate: selectedRate,
    materialCost,
    postProcessing,
    postProcessingCost,
    shipping: {
      fullName: String(orderDraft?.shipping?.fullName || "").trim(),
      streetAddress: String(orderDraft?.shipping?.streetAddress || "").trim(),
      city: String(orderDraft?.shipping?.city || "").trim(),
      postalCode: String(orderDraft?.shipping?.postalCode || "").trim(),
      method: shippingMethod
    },
    paymentOption,
    shippingCost,
    subtotal,
    discount,
    taxRate: TAX_RATE,
    tax,
    total,
    payableNow,
    dueOnDelivery
  };
}

function normalizePhoneToWhatsApp(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+")) return `whatsapp:${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `whatsapp:+${digits}`;
  return `whatsapp:+91${digits.replace(/^0+/, "")}`;
}

async function sendPaymentEmail({ to, subject, message }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM_EMAIL || !to) {
    return { sent: false, error: "SMTP is not configured or recipient missing" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });

    await transporter.sendMail({
      from: SMTP_FROM_EMAIL,
      to,
      subject,
      text: message
    });
    return { sent: true, error: "" };
  } catch (error) {
    return { sent: false, error: error.message || "Email failed" };
  }
}

async function sendPaymentWhatsApp({ toPhone, message }) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, DEFAULT_WHATSAPP_TO } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    return { sent: false, error: "Twilio is not configured" };
  }

  const resolvedPhone = toPhone || DEFAULT_WHATSAPP_TO;
  if (!resolvedPhone) {
    return { sent: false, error: "Recipient phone is missing" };
  }

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: normalizePhoneToWhatsApp(resolvedPhone),
      body: message
    });
    return { sent: true, error: "" };
  } catch (error) {
    return { sent: false, error: error.message || "WhatsApp failed" };
  }
}

router.post("/session", authMiddleware, async (req, res) => {
  const { paymentMethod = "card", orderDraft = {}, customerPhone = "" } = req.body;
  const allowedMethods = ["card", "bank", "qr"];
  if (!allowedMethods.includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid payment method" });
  }

  let pricing;
  try {
    pricing = getPricingFromDraft(orderDraft);
  } catch (error) {
    return res.status(400).json({ message: error.message || "Invalid order draft" });
  }

  const user = await User.findById(req.user.id).select("name email");
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  const order = await Order.create({
    user: req.user.id,
    customerName: pricing.shipping.fullName || user.name || user.email.split("@")[0],
    customerEmail: user.email,
    customerPhone: customerPhone || "",
    modelName: orderDraft.modelName || "Custom 3D Model Print",
    material: pricing.material,
    quantity: pricing.quantity,
    weight: pricing.weight,
    price: pricing.total,
    pricingBreakdown: {
      materialRate: pricing.materialRate,
      materialCost: pricing.materialCost,
      postProcessing: pricing.postProcessing,
      postProcessingCost: pricing.postProcessingCost,
      shipping: pricing.shipping,
      shippingCost: pricing.shippingCost,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      taxRate: pricing.taxRate,
      tax: pricing.tax,
      grandTotal: pricing.total,
      paymentOption: pricing.paymentOption,
      payableNow: pricing.payableNow,
      dueOnDelivery: pricing.dueOnDelivery
    },
    fileName: orderDraft.fileName || "",
    fileSize: orderDraft.fileSize || 0,
    status: "Pending",
    paymentStatus: "Unpaid"
  });

  const sessionId = `pay_${crypto.randomBytes(8).toString("hex")}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const qrPayload = `KINETIX3D|ORDER:${order.orderId}|AMOUNT:${pricing.payableNow.toFixed(2)}|SESSION:${sessionId}`;

  const session = await PaymentSession.create({
    sessionId,
    paymentMethod,
    order: order._id,
    amount: pricing.payableNow,
    status: "pending",
    qrPayload,
    expiresAt
  });

  await Notification.create({
    title: "Payment session created",
    message: `Session ${session.sessionId} created for ${order.orderId}`
  });

  res.status(201).json({
    sessionId: session.sessionId,
    orderId: order._id,
    displayOrderId: order.orderId,
    amount: pricing.payableNow,
    currency: "INR",
    paymentMethod: session.paymentMethod,
    qrPayload: session.qrPayload,
    expiresAt: session.expiresAt,
    pricing: {
      materialCost: pricing.materialCost,
      postProcessingCost: pricing.postProcessingCost,
      shippingCost: pricing.shippingCost,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      tax: pricing.tax,
      grandTotal: pricing.total,
      paymentOption: pricing.paymentOption,
      payableNow: pricing.payableNow,
      dueOnDelivery: pricing.dueOnDelivery
    }
  });
});

router.get("/session/:sessionId", authMiddleware, async (req, res) => {
  const session = await PaymentSession.findOne({ sessionId: req.params.sessionId }).populate("order");
  if (!session) return res.status(404).json({ message: "Session not found" });
  res.json(session);
});

router.post("/webhook", async (req, res) => {
  const { sessionId, event = "payment.succeeded" } = req.body;
  if (!sessionId) return res.status(400).json({ message: "sessionId is required" });

  const session = await PaymentSession.findOne({ sessionId }).populate("order");
  if (!session) return res.status(404).json({ message: "Session not found" });

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    session.status = "expired";
    await session.save();
    return res.status(400).json({ message: "Session expired" });
  }

  if (event !== "payment.succeeded") {
    session.status = "failed";
    await session.save();
    return res.status(400).json({ message: "Unhandled payment event" });
  }

  session.status = "paid";
  await session.save();

  const order = session.order;
  const isCod = order?.pricingBreakdown?.paymentOption === "cod";
  order.paymentStatus = isCod ? "Partially Paid" : "Paid";
  if (order.status === "Pending") order.status = "Printing";
  await order.save();

  const paidNow = Number(session.amount || 0).toFixed(2);
  const due = Number(order?.pricingBreakdown?.dueOnDelivery || 0).toFixed(2);
  const confirmationMessage = isCod
    ? `Advance payment confirmed for ${order.orderId}. Amount received now: INR ${paidNow}. Remaining COD due: INR ${due}.`
    : `Payment confirmed for ${order.orderId}. Amount received: INR ${paidNow}.`;
  const emailStatus = await sendPaymentEmail({
    to: order.customerEmail,
    subject: `Payment Success - ${order.orderId}`,
    message: confirmationMessage
  });
  const whatsappStatus = await sendPaymentWhatsApp({
    toPhone: order.customerPhone,
    message: confirmationMessage
  });

  await Notification.create({
    title: "Payment successful",
    message: `${order.orderId} marked as PAID`
  });

  res.json({
    message: "Payment confirmed",
    order,
    delivery: {
      email: emailStatus,
      whatsapp: whatsappStatus
    }
  });
});

export default router;
