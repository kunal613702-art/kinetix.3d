import { useState } from "react";
import { motion } from "framer-motion";
import { FaInstagram, FaFacebook, FaLinkedin, FaWhatsapp, FaTwitter } from "react-icons/fa";
import "./Contact.css";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [attachment, setAttachment] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSent(false);

    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("email", form.email);
      payload.append("phone", form.phone);
      payload.append("subject", "Contact Form");
      payload.append("message", form.message);
      if (attachment) payload.append("attachment", attachment);

      const response = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        body: payload
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send message");

      setSent(true);
      setForm({ name: "", email: "", phone: "", message: "" });
      setAttachment(null);
    } catch (err) {
      setError(err.message || "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="glow glow1"></div>
      <div className="glow glow2"></div>

      <motion.div
        className="contact-container"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="contact-left">
          <h1>Let's Build The Future.</h1>
          <p>
            Upload your 3D model or contact us directly. Nexus3D delivers precision, speed and
            perfection.
          </p>

          <div className="contact-info">
            <p>Jodhpur, Rajasthan</p>
            <p>+91 98765 43210</p>
            <p>nexus3d@gmail.com</p>
          </div>

          <div className="follow-section">
            <h3>Follow Us</h3>
            <div className="social-icons">
              <a href="#"><FaInstagram size={20} /></a>
              <a href="#"><FaTwitter size={20} /></a>
              <a href="#"><FaWhatsapp size={20} /></a>
              <a href="#"><FaLinkedin size={20} /></a>
              <a href="#"><FaFacebook size={20} /></a>
            </div>
          </div>
        </div>

        <div className="contact-right">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <label>Name</label>
            </div>

            <div className="input-group">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
              <label>Email</label>
            </div>

            <div className="input-group">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
              <label>Phone Number</label>
            </div>

            <div className="input-group">
              <textarea
                rows="4"
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                required
              />
              <label>Message</label>
            </div>

            <div className="input-group">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.stl,.obj,.zip"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              />
              <label>Attachment (optional)</label>
            </div>

            <button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send Message"}
            </button>

            {sent && <span className="success">Message sent successfully.</span>}
            {error && <span className="success" style={{ color: "#ff5f5f" }}>{error}</span>}
          </form>
        </div>
      </motion.div>
    </div>
  );
}
