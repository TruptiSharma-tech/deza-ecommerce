import React, { useEffect, useState } from "react";
import "./OrderSuccess.css";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { getUserEmail, cartKey } from "../utils/userStorage";
import { useAuth } from "../context/AuthContext";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const { clearCart } = useAuth();
  
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);

    const fetchOrderData = async () => {
        // 1. Try LocalStorage first (Fastest)
        const lastOrder = JSON.parse(localStorage.getItem("lastOrder"));
        
        if (lastOrder) {
          setOrder(lastOrder);
        } else {
          // 2. API Fallback (If cache was cleared)
          try {
            const { apiGetOrders } = await import("../utils/api");
            const orders = await apiGetOrders();
            if (orders && orders.length > 0) {
                // Sort by date and get latest
                const latest = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                setOrder(latest);
            }
          } catch (err) {
            console.error("Failed to fetch order fallback:", err);
          }
        }
    };

    fetchOrderData();

    // EXTRA SAFE: Clear cart and checkout info
    const performCleanup = async () => {
      if (clearCart) {
        await clearCart();
      } else {
        const userEmail = getUserEmail();
        localStorage.removeItem(cartKey(userEmail));
        localStorage.removeItem("deza_cart");
        window.dispatchEvent(new Event("cartUpdate"));
      }
      localStorage.removeItem("checkoutInfo");
    };
    
    performCleanup();

    // Stop confetti after 7 seconds
    const timer = setTimeout(() => setShowConfetti(false), 7000);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [clearCart]);

  const handleWhatsAppShare = () => {
    if (!order) return;
    
    const orderId = order.orderNumber || order.orderId || "DZ-" + String(order._id || Date.now()).slice(-6).toUpperCase();
    const firstItemImg = order.items?.[0]?.image || "";
    const trackUrl = `${window.location.origin}/track-order/${orderId}`;
    
    const msg = `*NEW ORDER CONFIRMED* 🛍️\n\nOrder ID: ${orderId}\nTotal: ₹${order.totalAmount || order.totalPrice}\nPayment: ${order.paymentMethod}\n\nPlease process my luxury delivery! 💛\n\nTrack here: ${trackUrl}`;
    
    window.open(`https://wa.me/919082710359?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="success-page">
      {showConfetti && (
        <Confetti 
          width={windowSize.width} 
          height={windowSize.height} 
          numberOfPieces={window.innerWidth < 600 ? 100 : 250} 
          recycle={false} 
          colors={["#d4af37", "#fff", "#1a1a1a", "#ffd369"]} 
        />
      )}

      <div className="success-card">
        <div style={{ fontSize: "72px", marginBottom: "10px" }}>✨</div>
        <h1>Success!</h1>
        <p>
          Thank you for choosing DEZA. Your order has been placed successfully and is now being processed.
        </p>

        {order ? (
          <div className="order-info-box">
            <span className="order-id">
              Order #{order.orderNumber || order.orderId || String(order._id).slice(-6).toUpperCase()}
            </span>
            <p><b>Items:</b> {order.items?.length || 0} Luxury Fragrances</p>
            <p><b>Total Amount:</b> ₹{(order.totalAmount || order.totalPrice)?.toLocaleString("en-IN")}</p>
            <p><b>Payment Mode:</b> {order.paymentMethod}</p>
            <p><b>Delivery:</b> 5-7 Business Days</p>
          </div>
        ) : (
          <div className="order-info-box" style={{ textAlign: 'center' }}>
            <p>Your luxury fragrance is on the way! 💛</p>
          </div>
        )}

        <p style={{ fontSize: '14px', opacity: 0.8 }}>
          A confirmation email has been sent to your inbox.
        </p>

        <div className="success-btns">
          <button onClick={() => navigate("/orders")}>My Orders</button>
          
          {order && (
            <button className="whatsapp-btn" onClick={handleWhatsAppShare}>
               Confirm on WhatsApp
            </button>
          )}
          
          <button className="home-btn" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
