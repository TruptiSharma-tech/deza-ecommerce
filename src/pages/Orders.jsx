import React, { useEffect, useState } from "react";
import { apiGetMyOrders, apiCancelOrder, apiReturnOrder, apiRefundOrder, apiSubmitReview } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "./Orders.css";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Return Modal states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Review State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [returnType, setReturnType] = useState("Refund");
  const [returnReason, setReturnReason] = useState("Wrong Product Received");
  const [returnMessage, setReturnMessage] = useState("");
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.email) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [currentUser?.email]);

  const [fetchError, setFetchError] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      console.log("📦 Fetching your secure orders...");
      const data = await apiGetMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setFetchError(err.message || "Failed to load orders");
      toast.error("Could not load your orders.");
    } finally {
      setLoading(false);
    }
  };

  // ❌ Cancel Order
  const cancelOrder = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      const updated = await apiCancelOrder(id);
      // Keep the order but update its status instead of filtering it out
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status: "Cancelled" } : o)));
      toast.success("Order cancelled successfully!");
    } catch (err) {
      console.error("Order Cancellation Failed:", err);
      toast.error(err.message || "Failed to cancel order");
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
    return true; // Temporarily allow returns for all delivered orders so you can test it
  };

  // ✅ Open Return Modal
  const openReturnModal = (order) => {
    setSelectedOrder(order);
    setReturnType("Refund");
    setReturnReason("Wrong Product Received");
    setReturnMessage("");
    setShowReturnModal(true);
  };

  const openReviewModal = (order, item) => {
    setSelectedOrder(order);
    setSelectedItem(item);
    setRating(5);
    setComment("");
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!comment.trim()) return toast.error("Please write a short review!");
    setIsSubmitting(true);
    try {
      await apiSubmitReview({
        productId: selectedItem.id || selectedItem._id,
        rating,
        comment,
      });
      toast.success("Review submitted! Thank you ✨");
      setShowReviewModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="empty-msg">✨ Fetching your orders...</div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h1 className="orders-title">📦 My Orders</h1>

      {fetchError ? (
        <div className="empty-msg">
          <p>❌ {fetchError}</p>
          <button className="track-order-btn" onClick={loadOrders} style={{ width: 'auto', padding: '10px 30px', marginTop: '20px' }}>
            Try Again
          </button>
        </div>
      ) : !currentUser ? (
        <p className="empty-msg">Please login to view your orders.</p>
      ) : orders.length === 0 ? (
        <p className="empty-msg">No Orders Yet 💛</p>
      ) : (
        <div className="orders-grid">
          {orders.map((o) => {
            const firstItem = (o.items || [])[0];
            const orderNum = o.orderNumber || o.orderId || "DZ-" + String(o._id).slice(-6).toUpperCase();
            const orderDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "Recently";
            const total = o.totalPrice || o.totalAmount || 0;
            const statusColor = {
              "Delivered": "#4caf50",
              "Cancelled": "#f44336",
              "Shipped": "#2196f3",
              "Out for Delivery": "#ff9800",
              "Processing": "#d4af37",
              "Packed": "#9c27b0",
            }[o.status] || "#d4af37";

            return (
              <div className="order-row" key={o._id}>
                {/* ── MAIN BAR ── */}
                <div className="order-bar">
                  {/* Product thumbnail */}
                  <img
                    src={firstItem?.image || "https://via.placeholder.com/50"}
                    alt={firstItem?.name || "Product"}
                    className="order-bar-img"
                  />

                  {/* Order number + date */}
                  <div className="order-bar-info">
                    <span className="order-bar-num">#{orderNum}</span>
                    <span className="order-bar-date">{orderDate}</span>
                  </div>

                  {/* Items count */}
                  <div className="order-bar-items">
                    {(o.items || []).length} item{(o.items || []).length > 1 ? "s" : ""}
                  </div>

                  {/* Total */}
                  <div className="order-bar-total">₹{total.toLocaleString()}</div>

                  {/* Payment */}
                  <div className="order-bar-pay">{o.paymentMethod || "N/A"}</div>

                  {/* Status & Actions section (Stuck to right) */}
                  <div className="order-right-section">
                    <div className="order-bar-status" style={{ color: statusColor, borderColor: statusColor }}>
                      {o.status || "Placed"}
                    </div>

                    <div className="order-bar-actions">
                      {o.status !== "Cancelled" && (
                        <button
                          className="obar-btn obar-track"
                          onClick={() => navigate(`/track-order/${o.orderId || o._id}`)}
                        >
                          📍 Track
                        </button>
                      )}
                      {o.status !== "Delivered" && o.status !== "Cancelled" && (
                        <button
                          className="obar-btn obar-cancel"
                          onClick={() => cancelOrder(o._id)}
                        >
                          ✕ Cancel
                        </button>
                      )}
                      {o.status === "Delivered" && isReturnAllowed(o) && !o.returnDetails && (
                        <button
                          className="obar-btn obar-return"
                          onClick={() => openReturnModal(o)}
                        >
                          ↩ Return
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── EXPANDABLE ITEMS ROW ── */}
                <div className="order-items-bar">
                  {(o.items || []).map((item, idx) => (
                    <div key={`${item.id || idx}`} className="oitem-bar">
                      <img src={item.image || "https://via.placeholder.com/40"} alt={item.name} className="oitem-bar-img" />
                      <div className="oitem-bar-info">
                        <span className="oitem-bar-name">{item.name || "Item"}</span>
                        <span className="oitem-bar-meta">Size: {item.selectedSize || "N/A"} · Qty: {item.qty || 1} · ₹{(item.price || 0) * (item.qty || 1)}</span>
                      </div>
                      {o.status === "Delivered" && (
                        <button
                          className="obar-btn obar-track"
                          style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                          onClick={() => openReviewModal(o, item)}
                        >
                          ⭐ Review
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REVIEW MODAL */}
      {showReviewModal && (
        <div className="return-modal-overlay">
          <div className="return-modal" style={{ textAlign: 'center' }}>
            <h2>Rate & Review ✨</h2>
            <p style={{ color: '#d4af37', marginBottom: '15px' }}>{selectedItem?.name}</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              {[1, 2, 3, 4, 5].map((num) => (
                <span 
                  key={num} 
                  style={{ fontSize: '2rem', cursor: 'pointer', color: num <= rating ? '#d4af37' : '#444' }}
                  onClick={() => setRating(num)}
                >
                  ★
                </span>
              ))}
            </div>

            <textarea
              placeholder="Tell us what you loved about this fragrance..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ minHeight: '100px' }}
            />

            <div className="return-actions">
              <button
                className="cancel-btn"
                style={{ background: "#444" }}
                onClick={() => setShowReviewModal(false)}
              >
                Cancel
              </button>

              <button
                className="cancel-btn"
                style={{ background: "#d4af37", color: "#111" }}
                onClick={submitReview}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Post Review"}
              </button>
            </div>
          </div>
        </div>
      )}
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
