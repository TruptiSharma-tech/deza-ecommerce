import React, { useEffect, useState } from "react";
import { apiGetMyOrders, apiCancelOrder, apiReturnOrder, apiRefundOrder } from "../utils/api";
import toast from "react-hot-toast";
import "./Orders.css";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Return Modal states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [returnType, setReturnType] = useState("Refund");
  const [returnReason, setReturnReason] = useState("Wrong Product Received");
  const [returnMessage, setReturnMessage] = useState("");
  const [gpsTick, setGpsTick] = useState(0);

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  // Simulated GPS Movement Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setGpsTick(prev => (prev + 0.5) % 100);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      if (currentUser?.email) {
        const data = await apiGetMyOrders(currentUser.email);
        setOrders(Array.isArray(data) ? data : []);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // ❌ Cancel Order
  const cancelOrder = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      const updated = await apiCancelOrder(id);
      setOrders((prev) => prev.map((o) => (o._id === id ? updated : o)));
      toast.success("Order cancelled successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ⭐ Progress Bar Steps
  const getProgressStep = (status) => {
    switch (status) {
      case "Processing": return 1;
      case "Packed": return 2;
      case "Shipped": return 3;
      case "Out for Delivery": return 4;
      case "Delivered": return 5;
      case "Cancelled": return 0;
      default: return 1;
    }
  };

  const isReturnAllowed = (order) => {
    if (order.status !== "Delivered") return false;
    if (!order.deliveredAt) return true; // Support older orders initially
    const deliveredTime = new Date(order.deliveredAt).getTime();
    const now = new Date().getTime();
    const diffInHours = (now - deliveredTime) / (1000 * 60 * 60);
    return diffInHours <= 48;
  };

  // ✅ Open Return Modal
  const openReturnModal = (order) => {
    setSelectedOrder(order);
    setReturnType("Refund");
    setReturnReason("Wrong Product Received");
    setReturnMessage("");
    setShowReturnModal(true);
  };

  // ✅ Submit Return Request
  const submitReturnRequest = async () => {
    if (!selectedOrder) return;

    try {
      const updated = await apiReturnOrder(selectedOrder._id, {
        returnType,
        reason: returnReason,
        message: returnMessage,
      });
      setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? updated : o)));
      toast.success("Return Request Sent Successfully! ✨");
      setShowReturnModal(false);
      setSelectedOrder(null);
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  // 💰 Refund Request
  const requestRefund = async (id) => {
    if (!window.confirm("Do you want to request REFUND for this order?")) return;

    try {
      const updated = await apiRefundOrder(id);
      setOrders((prev) => prev.map((o) => (o._id === id ? updated : o)));
      toast.success("Refund Request Sent to Admin! 💰");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="orders-page">
        <h1 className="orders-title">📦 My Orders</h1>
        <p className="empty-msg">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h1 className="orders-title">📦 My Orders</h1>

      {!currentUser ? (
        <p className="empty-msg">Please login to view your orders.</p>
      ) : orders.length === 0 ? (
        <p className="empty-msg">No Orders Yet 💛</p>
      ) : (
        <div className="orders-grid">
          {orders.map((o) => (
            <div className="order-card" key={o._id}>
              <div className="order-head">
                <h2>Order #{o.orderId || "DZ-" + String(o._id).slice(-6).toUpperCase()}</h2>
                <span className="order-status">{o.status || "Placed"}</span>
              </div>

              <p>
                <b>Date:</b> {o.date || "N/A"}
              </p>
              <p>
                <b>Total:</b> ₹{o.totalPrice || o.total || 0}
              </p>
              <p>
                <b>Payment:</b> {o.paymentMethod || "N/A"}
              </p>

              {/* Return Refund Status */}
              <p>
                <b>Return Status:</b>{" "}
                <span style={{ color: "#d4af37" }}>
                  {o.returnStatus || "Not Requested"}
                </span>
              </p>

              <p>
                <b>Refund Status:</b>{" "}
                <span style={{ color: "#d4af37" }}>
                  {o.refundStatus || "Not Requested"}
                </span>
              </p>

              {/* Enhanced Real-Time GPS Tracking - Show for all active states */}
              {(o.status !== "Delivered" && o.status !== "Cancelled" && !o.status?.includes("Return")) && (
                <div className="order-gps-tracking deluxe-gps">
                  <div className="gps-header">
                    <span className="dot pulse" style={{ background: (o.status === "Processing" || o.status === "Packed") ? "#f1c40f" : "#ff3e3e" }}></span>
                    {(o.status === "Processing" || o.status === "Packed") ? "📡 ORDER PREPARATION: ACTIVE" : "📡 LIVE GPS TRACE: ACTIVE"}
                  </div>

                  <div className="gps-map-container">
                    <div className="gps-path-line"></div>
                    <div
                      className="gps-covered-line"
                      style={{
                        width: o.status === "Processing" ? `${5 + (gpsTick * 0.05)}%` :
                          o.status === "Packed" ? `${25 + (gpsTick * 0.05)}%` :
                            o.status === "Shipped" ? `${45 + (gpsTick * 0.1)}%` : `${85 + (gpsTick * 0.05)}%`
                      }}
                    ></div>

                    <div
                      className="truck-marker-fancy"
                      style={{
                        left: o.status === "Processing" ? `${5 + (gpsTick * 0.05)}%` :
                          o.status === "Packed" ? `${25 + (gpsTick * 0.05)}%` :
                            o.status === "Shipped" ? `${45 + (gpsTick * 0.1)}%` : `${85 + (gpsTick * 0.05)}%`
                      }}
                    >
                      <div className="truck-icon">{(o.status === "Shipped" || o.status === "Out for Delivery") ? "🚚" : "📦"}</div>
                      <div className="truck-ping"></div>
                    </div>

                    <div className="checkpoint start">🏢 Warehouse</div>
                    <div className="checkpoint end">🏠 You</div>
                  </div>

                  <div className="gps-info-grid">
                    <div className="info-box">
                      <small>Stage</small>
                      <p>
                        {o.status === "Processing" ? "Quality Check Running" :
                          o.status === "Packed" ? "Securely Boxed" :
                            o.status === "Shipped" ? "In Transit (Main Highway)" : "Local Distribution Centre"}
                      </p>
                    </div>
                    <div className="info-box">
                      <small>Expected Movement</small>
                      <p>
                        {o.status === "Processing" ? "Next: Packing" :
                          o.status === "Packed" ? "Next: Courier Pickup" :
                            o.status === "Shipped" ? "Next: Dist. Centre" : "Next: Doorstep Delivery"}
                      </p>
                    </div>
                  </div>

                  <p className="gps-disclaimer">Real-time status refreshed 3s ago • Precision Tracking Active</p>
                </div>
              )}

              {/* Progress Bar */}
              <div className="progress-bar-container">
                {[
                  "Placed",
                  "Packed",
                  "Shipped",
                  "Out for Delivery",
                  "Delivered",
                ].map((step, index) => (
                  <div
                    key={step}
                    className={`progress-step ${index < getProgressStep(o.status) ? "active" : ""}`}
                  >
                    {step}
                  </div>
                ))}
              </div>

              {/* Cancel only before Delivered */}
              {o.status !== "Delivered" && o.status !== "Cancelled" && (
                <button
                  className="cancel-btn"
                  onClick={() => cancelOrder(o._id)}
                >
                  Cancel Order
                </button>
              )}

              {/* Return / Refund after Delivered */}
              {o.status === "Delivered" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                  {isReturnAllowed(o) ? (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        className="cancel-btn"
                        style={{ background: "#444" }}
                        onClick={() => openReturnModal(o)}
                        disabled={o.returnStatus === "Return Requested"}
                      >
                        {o.returnStatus === "Return Requested"
                          ? "Return Requested ✅"
                          : "Request Return / Exchange"}
                      </button>

                      <button
                        className="cancel-btn"
                        style={{ background: "#d4af37", color: "#111" }}
                        onClick={() => requestRefund(o._id)}
                        disabled={o.refundStatus === "Refund Requested"}
                      >
                        {o.refundStatus === "Refund Requested"
                          ? "Refund Requested ✅"
                          : "Request Refund"}
                      </button>
                    </div>
                  ) : (
                    <p className="return-expired">
                      ⚠️ Return/Exchange window closed (48h expired)
                    </p>
                  )}
                </div>
              )}

              {/* Items */}
              <div className="order-items">
                {(o.items || []).map((item, idx) => (
                  <div
                    key={`${item.id || idx}-${item.selectedSize}`}
                    className="order-item"
                  >
                    <img
                      src={item.image || "https://via.placeholder.com/75"}
                      alt={item.name || "Item"}
                    />
                    <div>
                      <p className="order-item-name">
                        {item.name || "Unnamed Item"}
                      </p>
                      <p>Size: {item.selectedSize || "N/A"}</p>
                      <p>Qty: {item.qty || 1}</p>
                      <p className="order-item-price">
                        ₹{(item.price || 0) * (item.qty || 1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer-note">
                ✨ Thank you for shopping with DEZA
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RETURN MODAL */}
      {showReturnModal && (
        <div className="return-modal-overlay">
          <div className="return-modal">
            <h2>Return Request</h2>

            <label>Return Type</label>
            <select
              value={returnType}
              onChange={(e) => setReturnType(e.target.value)}
            >
              <option value="Refund">Refund</option>
              <option value="Exchange">Exchange</option>
            </select>

            <label>Reason</label>
            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            >
              <option>Wrong Product Received</option>
              <option>Damaged Product</option>
              <option>Leakage / Broken Bottle</option>
              <option>Not Satisfied With Smell</option>
              <option>Allergic Reaction</option>
              <option>Delivery Late</option>
              <option>Other</option>
            </select>

            <label>Message (Optional)</label>
            <textarea
              placeholder="Explain your issue..."
              value={returnMessage}
              onChange={(e) => setReturnMessage(e.target.value)}
            />

            <div className="return-actions">
              <button
                className="cancel-btn"
                style={{ background: "#444" }}
                onClick={() => setShowReturnModal(false)}
              >
                Close
              </button>

              <button
                className="cancel-btn"
                style={{ background: "#d4af37", color: "#111" }}
                onClick={submitReturnRequest}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
