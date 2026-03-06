import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import nodemailer from "nodemailer";
import twilio from "twilio";
import Contact from "../models/Contact.js";

const router = express.Router();
const ACK_MESSAGE = `Thank you for reaching out to Kinetix3D.
We’ve received your request and your personalized quote will be sent to you shortly.`;

const contactsUploadDir = path.resolve("uploads", "contacts");
if (!fs.existsSync(contactsUploadDir)) {
  fs.mkdirSync(contactsUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, contactsUploadDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`)
});

const upload = multer({ storage });

function normalizePhoneToWhatsApp(phone) {
  if (!phone) return "";
  const digits = phone.replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+")) return `whatsapp:${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `whatsapp:+${digits}`;
  return `whatsapp:+91${digits.replace(/^0+/, "")}`;
}

async function sendEmailReply({ to, subject, reply }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM_EMAIL) {
    return { sent: false, error: "SMTP is not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: SMTP_FROM_EMAIL,
      to,
      subject,
      text: reply
    });

    return { sent: true, error: "" };
  } catch (error) {
    return { sent: false, error: error.message || "Email send failed" };
  }
}

async function sendWhatsAppReply({ toPhone, reply }) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    return { sent: false, error: "Twilio WhatsApp is not configured" };
  }

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const to = normalizePhoneToWhatsApp(toPhone);
    if (!to) {
      return { sent: false, error: "Invalid phone number" };
    }

    await client.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to,
      body: reply
    });

    return { sent: true, error: "" };
  } catch (error) {
    return { sent: false, error: error.message || "WhatsApp send failed" };
  }
}

router.post("/", upload.single("attachment"), async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ message: "Name, email, phone, and message are required" });
    }

    const attachment = req.file
      ? {
          fileName: req.file.filename,
          originalName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          url: `/uploads/contacts/${req.file.filename}`
        }
      : null;

    const contact = await Contact.create({
      name,
      email,
      phone,
      subject: subject || "General Inquiry",
      message,
      attachment
    });

    const emailResult = await sendEmailReply({
      to: contact.email,
      subject: `Re: ${contact.subject}`,
      reply: ACK_MESSAGE
    });

    const whatsappResult = await sendWhatsAppReply({
      toPhone: contact.phone,
      reply: ACK_MESSAGE
    });

    contact.replies.push({
      adminName: "Kinetix3D Bot",
      message: ACK_MESSAGE,
      emailSent: emailResult.sent,
      whatsappSent: whatsappResult.sent,
      emailError: emailResult.error,
      whatsappError: whatsappResult.error
    });
    if (emailResult.sent || whatsappResult.sent) {
      contact.status = "Replied";
    }
    await contact.save();

    res.status(201).json({ message: "Message received", contact });
  } catch (error) {
    res.status(500).json({ message: "Failed to create contact", error: error.message });
  }
});

router.get("/admin", async (req, res) => {
  const { status = "All", search = "" } = req.query;
  const query = {};
  if (status !== "All") query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { customerCode: { $regex: search, $options: "i" } }
    ];
  }

  const contacts = await Contact.find(query).sort({ updatedAt: -1 });
  res.json(contacts);
});

router.get("/admin/:id", async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) return res.status(404).json({ message: "Contact not found" });
  res.json(contact);
});

router.post("/admin/:id/reply", async (req, res) => {
  try {
    const { message, adminName = "Admin", sendEmail = true, sendWhatsApp = true } = req.body;
    if (!message) return res.status(400).json({ message: "Reply message is required" });

    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: "Contact not found" });

    const emailResult = sendEmail
      ? await sendEmailReply({
          to: contact.email,
          subject: `Re: ${contact.subject}`,
          reply: message
        })
      : { sent: false, error: "" };

    const whatsappResult = sendWhatsApp
      ? await sendWhatsAppReply({
          toPhone: contact.phone,
          reply: message
        })
      : { sent: false, error: "" };

    contact.replies.push({
      adminName,
      message,
      emailSent: emailResult.sent,
      whatsappSent: whatsappResult.sent,
      emailError: emailResult.error,
      whatsappError: whatsappResult.error
    });

    if (emailResult.sent || whatsappResult.sent) {
      contact.status = "Replied";
    }

    await contact.save();
    res.json({
      message: "Reply processed",
      reply: contact.replies[contact.replies.length - 1],
      contact
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to send reply", error: error.message });
  }
});

router.patch("/admin/:id/status", async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!contact) return res.status(404).json({ message: "Contact not found" });
  res.json(contact);
});

export default router;
