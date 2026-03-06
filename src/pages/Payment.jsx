import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./Payment.css";

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

const DISCOUNT_RATE = 0.05;
const DISCOUNT_QTY = 5;
const TAX_RATE = 0.088;
const COD_ADVANCE_RATE = 0.01;

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const fmtInr = (value) => `INR ${Number(value || 0).toFixed(2)}`;

export default function Payment() {
  const navigate = useNavigate();
  const [baseDraft, setBaseDraft] = useState(null);
  const [activeTab, setActiveTab] = useState("card");
  const [creatingSession, setCreatingSession] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [session, setSession] = useState(null);
  const [statusText, setStatusText] = useState("Waiting for payment...");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState("");
  const [cardForm, setCardForm] = useState({
    holder: "",
    number: "",
    expiry: "",
    cvc: "",
    phone: ""
  });
  const [quoteForm, setQuoteForm] = useState({
    material: "PLA",
    quantity: 1,
    postProcessing: {
      sanding: false,
      primerPainting: false,
      supportRemoval: false
    },
    shipping: {
      fullName: "",
      streetAddress: "",
      city: "",
      postalCode: "",
      method: "standard"
    },
    paymentOption: "online"
  });
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth", { state: { from: "/payment" }, replace: true });
      return;
    }

    const stored = localStorage.getItem("pendingOrder");
    if (!stored) {
      navigate("/upload", { replace: true });
      return;
    }

    const parsed = JSON.parse(stored);
    const normalizedQuantity = Math.max(1, Math.floor(Number(parsed.quantity || 1)));
    const normalizedDraft = {
      ...parsed,
      quantity: normalizedQuantity,
      unitWeight: Number(parsed.unitWeight || 0),
      weight: Number(parsed.weight || 0)
    };
    setBaseDraft(normalizedDraft);
    setQuoteForm((prev) => ({
      ...prev,
      material: parsed.material || "PLA",
      quantity: normalizedQuantity
    }));
  }, [navigate]);

  useEffect(() => {
    if (!session?.expiresAt) return;
    const update = () => {
      const left = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(left);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [session]);

  const pricing = useMemo(() => {
    const quantity = Math.max(1, Math.floor(Number(quoteForm.quantity || 1)));
    const material = quoteForm.material;
    const materialRate = MATERIAL_RATES[material] || MATERIAL_RATES.PLA;
    const unitWeight = Number(baseDraft?.unitWeight || 0);
    const fallbackWeight = Number(baseDraft?.weight || 0);
    const chargeableUnits = unitWeight > 0 ? unitWeight * quantity : (fallbackWeight > 0 ? fallbackWeight : quantity);
    const materialCost = round2(chargeableUnits * materialRate);

    const postProcessingCost = round2(
      (quoteForm.postProcessing.sanding ? POST_PROCESSING_COSTS.sanding : 0) +
      (quoteForm.postProcessing.primerPainting ? POST_PROCESSING_COSTS.primerPainting : 0) +
      (quoteForm.postProcessing.supportRemoval ? POST_PROCESSING_COSTS.supportRemoval : 0)
    );
    const shippingCost = SHIPPING_COSTS[quoteForm.shipping.method] || SHIPPING_COSTS.standard;
    const subtotal = round2(materialCost + postProcessingCost + shippingCost);
    const discount = quantity >= DISCOUNT_QTY ? round2(subtotal * DISCOUNT_RATE) : 0;
    const taxableAmount = round2(subtotal - discount);
    const tax = round2(taxableAmount * TAX_RATE);
    const grandTotal = round2(taxableAmount + tax);
    const payableNow = quoteForm.paymentOption === "cod" ? round2(grandTotal * COD_ADVANCE_RATE) : grandTotal;
    const dueOnDelivery = round2(grandTotal - payableNow);

    return {
      materialRate,
      chargeableUnits,
      materialCost,
      postProcessingCost,
      shippingCost,
      subtotal,
      discount,
      tax,
      grandTotal,
      payableNow,
      dueOnDelivery
    };
  }, [baseDraft?.weight, quoteForm]);

  const fullOrderDraft = useMemo(() => {
    if (!baseDraft) return null;
    const normalizedQuantity = Math.max(1, Math.floor(Number(quoteForm.quantity || 1)));
    const unitWeight = Number(baseDraft.unitWeight || 0);
    const computedWeight = unitWeight > 0 ? unitWeight * normalizedQuantity : Number(baseDraft.weight || 0);
    return {
      ...baseDraft,
      material: quoteForm.material,
      quantity: normalizedQuantity,
      weight: computedWeight,
      postProcessing: quoteForm.postProcessing,
      shipping: quoteForm.shipping,
      paymentOption: quoteForm.paymentOption,
      price: pricing.grandTotal
    };
  }, [baseDraft, quoteForm, pricing.grandTotal]);

  const qrImageUrl = useMemo(() => {
    if (!session?.qrPayload) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(session.qrPayload)}`;
  }, [session]);

  const shippingValid = useMemo(() => {
    const { fullName, streetAddress, city, postalCode } = quoteForm.shipping;
    if (!fullName.trim()) return false;
    return streetAddress.trim() && city.trim() && postalCode.trim();
  }, [quoteForm.shipping]);

  const formatTimer = () => {
    const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const sec = String(timeLeft % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  function onShippingChange(field, value) {
    setQuoteForm((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        [field]: value
      }
    }));
  }

  function onPostProcessToggle(field) {
    setQuoteForm((prev) => ({
      ...prev,
      postProcessing: {
        ...prev.postProcessing,
        [field]: !prev.postProcessing[field]
      }
    }));
  }

  async function createPaymentSession() {
    if (!fullOrderDraft || !shippingValid) return null;
    if (session) return session;

    const token = localStorage.getItem("token");
    setCreatingSession(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/payment/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethod: activeTab,
          customerPhone: cardForm.phone,
          orderDraft: fullOrderDraft
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create payment session");

      setSession(data);
      setStatusText("Waiting for payment...");
      return data;
    } catch (err) {
      setError(err.message || "Payment session error");
      return null;
    } finally {
      setCreatingSession(false);
    }
  }

  async function confirmPayment() {
    if (!shippingValid) {
      setError("Please complete all shipping details before payment.");
      return;
    }

    const currentSession = await createPaymentSession();
    if (!currentSession) return;

    setConfirmingPayment(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/payment/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          event: "payment.succeeded"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Payment confirmation failed");

      setPaymentSuccess(true);
      setStatusText("Payment successful");
      localStorage.removeItem("pendingOrder");
      setTimeout(() => navigate("/payment/success", { replace: true }), 1000);
    } catch (err) {
      setError(err.message || "Payment failed");
      setStatusText("Payment failed");
    } finally {
      setConfirmingPayment(false);
    }
  }

  if (!baseDraft) return null;

  return (
    <div className="pay-bg">
      <div className="pay-blob pay-blob-a"></div>
      <div className="pay-blob pay-blob-b"></div>
      <div className="pay-shell">
        <div className="pay-left">
          <div className="pay-brand">
            <h2>Kinetix3D</h2>
            <p>Precision in Every Layer</p>
          </div>
          <button className="pay-link" type="button">Download invoice PDF</button>

          <section className="pay-section">
            <h3>Material & Quantity</h3>
            <div className="pay-grid">
              <select
                value={quoteForm.material}
                onChange={(e) => setQuoteForm((prev) => ({ ...prev, material: e.target.value }))}
              >
                <option value="PLA">PLA (INR 2.00)</option>
                <option value="ABS">ABS (INR 2.50)</option>
                <option value="PETG">PETG (INR 2.80)</option>
                <option value="TPU">TPU (INR 3.20)</option>
              </select>
              <input
                type="number"
                min="1"
                step="1"
                value={quoteForm.quantity}
                onChange={(e) =>
                  setQuoteForm((prev) => ({
                    ...prev,
                    quantity: Math.max(1, Math.floor(Number(e.target.value || 1)))
                  }))
                }
                placeholder="Quantity"
              />
            </div>
          </section>

          <section className="pay-section">
            <h3>Post-Processing</h3>
            <div className="pay-checks">
              <label>
                <input
                  type="checkbox"
                  checked={quoteForm.postProcessing.sanding}
                  onChange={() => onPostProcessToggle("sanding")}
                />
                Standard Sanding (INR 35)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={quoteForm.postProcessing.primerPainting}
                  onChange={() => onPostProcessToggle("primerPainting")}
                />
                Primer/Painting (INR 120)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={quoteForm.postProcessing.supportRemoval}
                  onChange={() => onPostProcessToggle("supportRemoval")}
                />
                Support Removal (INR 25)
              </label>
            </div>
          </section>

          <section className="pay-section">
            <h3>Shipping Details</h3>
            <div className="pay-form">
              <input
                placeholder="Full Name"
                value={quoteForm.shipping.fullName}
                onChange={(e) => onShippingChange("fullName", e.target.value)}
              />
              <input
                placeholder="Street Address"
                value={quoteForm.shipping.streetAddress}
                onChange={(e) => onShippingChange("streetAddress", e.target.value)}
              />
              <div className="pay-grid">
                <input
                  placeholder="City"
                  value={quoteForm.shipping.city}
                  onChange={(e) => onShippingChange("city", e.target.value)}
                />
                <input
                  placeholder="Postal Code"
                  value={quoteForm.shipping.postalCode}
                  onChange={(e) => onShippingChange("postalCode", e.target.value)}
                />
              </div>
              <select
                value={quoteForm.shipping.method}
                onChange={(e) => onShippingChange("method", e.target.value)}
              >
                <option value="standard">Standard Shipping (INR 60)</option>
                <option value="express">Express Shipping (INR 180)</option>
              </select>
              <select
                value={quoteForm.paymentOption}
                onChange={(e) => setQuoteForm((prev) => ({ ...prev, paymentOption: e.target.value }))}
              >
                <option value="online">Online Payment (100% now)</option>
                <option value="cod">Cash on Delivery (1% advance now)</option>
              </select>
            </div>
          </section>

          <section className="pay-section">
            <h3>Real-Time Price Summary</h3>
            <div className="pay-items">
              <div className="pay-row">
                <span>
                  Material Cost ({pricing.chargeableUnits.toFixed(2)} x {pricing.materialRate.toFixed(2)})
                </span>
                <b>{fmtInr(pricing.materialCost)}</b>
              </div>
              <div className="pay-row">
                <span>Post-Processing</span>
                <b>{fmtInr(pricing.postProcessingCost)}</b>
              </div>
              <div className="pay-row">
                <span>Shipping</span>
                <b>{fmtInr(pricing.shippingCost)}</b>
              </div>
              <hr />
              <div className="pay-row">
                <span>Subtotal</span>
                <b>{fmtInr(pricing.subtotal)}</b>
              </div>
              <div className="pay-row">
                <span>Discount {quoteForm.quantity >= DISCOUNT_QTY ? "(5%)" : ""}</span>
                <b>- {fmtInr(pricing.discount)}</b>
              </div>
              <div className="pay-row">
                <span>Tax 8.8%</span>
                <b>{fmtInr(pricing.tax)}</b>
              </div>
              <div className="pay-row">
                <span>Payment Type</span>
                <b>{quoteForm.paymentOption === "cod" ? "COD (1% advance)" : "Online"}</b>
              </div>
            </div>

            <div className="pay-total">
              <span>Grand Total</span>
              <h1>{fmtInr(pricing.grandTotal)}</h1>
            </div>
            <div className="pay-row pay-strong">
              <span>Payable Now</span>
              <b>{fmtInr(pricing.payableNow)}</b>
            </div>
            {quoteForm.paymentOption === "cod" && (
              <div className="pay-row">
                <span>Due on Delivery</span>
                <b>{fmtInr(pricing.dueOnDelivery)}</b>
              </div>
            )}
          </section>
        </div>

        <div className="pay-right">
          <div className="pay-tabs">
            <button className={activeTab === "card" ? "active" : ""} onClick={() => setActiveTab("card")}>Credit/Debit Card</button>
            <button className={activeTab === "bank" ? "active" : ""} onClick={() => setActiveTab("bank")}>Bank Transfer</button>
            <button className={activeTab === "qr" ? "active" : ""} onClick={() => setActiveTab("qr")}>QR Code Payment</button>
          </div>

          {activeTab !== "qr" && (
            <div className="pay-form">
              <input
                placeholder="Cardholder Name"
                value={cardForm.holder}
                onChange={(e) => setCardForm((s) => ({ ...s, holder: e.target.value }))}
              />
              <div className="pay-input-icon">
                <input
                  placeholder="Card Number •••• •••• •••• 4242"
                  value={cardForm.number}
                  onChange={(e) => setCardForm((s) => ({ ...s, number: e.target.value }))}
                />
                <span>Mastercard</span>
              </div>
              <div className="pay-grid">
                <input
                  placeholder="MM/YY"
                  value={cardForm.expiry}
                  onChange={(e) => setCardForm((s) => ({ ...s, expiry: e.target.value }))}
                />
                <input
                  placeholder="CVC"
                  value={cardForm.cvc}
                  onChange={(e) => setCardForm((s) => ({ ...s, cvc: e.target.value }))}
                />
              </div>
              <input
                placeholder="WhatsApp number (+91...)"
                value={cardForm.phone}
                onChange={(e) => setCardForm((s) => ({ ...s, phone: e.target.value }))}
              />
            </div>
          )}

          <div className="pay-qr">
            <div className="pay-qr-frame">
              {qrImageUrl ? <img src={qrImageUrl} alt="Payment QR" /> : <span>QR will appear after session creation</span>}
            </div>
            <p className={paymentSuccess ? "ok" : ""}>{statusText}</p>
          </div>

          {error && <p className="pay-error">{error}</p>}

          <button
            className="pay-btn"
            onClick={confirmPayment}
            disabled={creatingSession || confirmingPayment || (session && timeLeft === 0)}
          >
            {confirmingPayment ? "Processing..." : `Pay Now (${fmtInr(pricing.payableNow)})`}
          </button>

          <div className="pay-footer">
            <span>Remaining: {session ? formatTimer() : "09:45"}</span>
            {paymentSuccess && <span className="success-mark">Payment successful</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
