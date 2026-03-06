import { Link } from "react-router-dom";

export default function PaymentSuccess() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#111116",
        color: "white",
        fontFamily: "Inter, Segoe UI, sans-serif",
        padding: 24
      }}
    >
      <div
        style={{
          width: "min(560px, 100%)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.14)",
          padding: 28,
          background: "rgba(24,24,32,0.7)",
          textAlign: "center"
        }}
      >
        <h1 style={{ marginTop: 0 }}>Payment Successful</h1>
        <p>Your order is now marked as PAID and moved to production.</p>
        <p>Email + WhatsApp confirmation has been triggered.</p>
        <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
          <Link to="/dashboard">
            <button style={{ height: 42, padding: "0 18px", borderRadius: 12, border: 0, background: "#6a4bff", color: "white", cursor: "pointer" }}>
              Go to Dashboard
            </button>
          </Link>
          <Link to="/upload">
            <button style={{ height: 42, padding: "0 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "white", cursor: "pointer" }}>
              New Order
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
