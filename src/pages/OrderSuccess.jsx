import React, { useEffect, useState } from "react";
import "./OrderSucess.css";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { getUserEmail, cartKey } from "../utils/userStorage";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Read the order details stored during checkout
    const lastOrder = JSON.parse(localStorage.getItem("lastOrder"));
    if (lastOrder) {
      setOrder(lastOrder);
      // Clear it after reading so it doesn't show on next visit
      localStorage.removeItem("lastOrder");
    }

    // EXTRA SAFE: Force clear cart and checkout info upon success screen load
    const userEmail = getUserEmail();
    localStorage.removeItem(cartKey(userEmail));
    localStorage.removeItem("deza_cart"); // legacy fallback
    localStorage.removeItem("checkoutInfo");
    window.dispatchEvent(new Event("cartUpdate"));

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="success-page">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} colors={["#d4af37", "#fff", "#1a1a1a", "#ffd369"]} />}

      <div className="success-card">
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
        <h1>Order Placed Successfully!</h1>
        <p className="order-success-sub">
          Your luxury fragrance is on the way 💛
        </p>

        {order && (
          <div style={{
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
            textAlign: "left",
          }}>
            <p style={{ margin: "0 0 8px", fontSize: "13px", opacity: 0.7 }}>ORDER DETAILS</p>
            <p style={{ margin: "4px 0", fontWeight: "bold", color: "#d4af37", fontSize: "18px" }}>
              {order.orderId || "DZ-" + String(order._id).slice(-6).toUpperCase()}
            </p>
            <p style={{ margin: "4px 0", fontSize: "14px" }}>
              <b>Total:</b> ₹{order.totalPrice?.toLocaleString("en-IN")}
            </p>
            <p style={{ margin: "4px 0", fontSize: "14px" }}>
              <b>Payment:</b> {order.paymentMethod}
            </p>
            <p style={{ margin: "4px 0", fontSize: "14px" }}>
              <b>Estimated Delivery:</b> 7–10 Business Days
            </p>
          </div>
        )}

        <p className="order-success-footer">
          A confirmation email has been sent to your registered email address.
        </p>

        <div className="success-btns">
          <button onClick={() => navigate("/orders")}>View My Orders</button>
          <button 
            style={{ background: "#25d366", color: "#fff", borderColor: "#25d366" }}
            onClick={() => {
              const firstItemImg = order?.items?.[0]?.image || "";
              const trackUrl = `${window.location.origin}/track-order/${order.orderId || order._id}`;
              const isUrl = firstItemImg.startsWith("http");
              
              const previewLink = isUrl ? firstItemImg : trackUrl;
              
              const msg = `${previewLink}\n\n*NEW ORDER CONFIRMED* 🛍️\n\nOrder ID: ${order.orderId || "DZ-" + String(order._id).slice(-6).toUpperCase()}\nTotal: ₹${order.totalPrice}\nPayment: ${order.paymentMethod}\n\nPlease process my luxury delivery! 💛`;
              window.open(`https://wa.me/919082710359?text=${encodeURIComponent(msg)}`, "_blank");
            }}
          >
            Share on WhatsApp
          </button>
          <button className="home-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
