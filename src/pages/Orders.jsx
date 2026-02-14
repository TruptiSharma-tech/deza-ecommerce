import React, { useEffect, useState } from "react";
import "./Orders.css";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  // ✅ Return Modal states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [returnType, setReturnType] = useState("Refund");
  const [returnReason, setReturnReason] = useState("Wrong Product Received");
  const [returnMessage, setReturnMessage] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("dezaOrders")) || [];
      if (Array.isArray(stored)) {
        setOrders([...stored].reverse());
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Error parsing orders:", err);
      setOrders([]);
    }
  };

  const saveOrders = (updatedOrders) => {
    setOrders(updatedOrders);
    localStorage.setItem(
      "dezaOrders",
      JSON.stringify([...updatedOrders].reverse()),
    );
  };

  // ❌ Cancel Order
  const cancelOrder = (id) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    const updatedOrders = orders.filter((o) => o.id !== id);
    saveOrders(updatedOrders);
  };

  // ⭐ Progress Bar Steps
  const getProgressStep = (status) => {
    switch (status) {
      case "Packed":
        return 2;
      case "Shipped":
        return 3;
      case "Out for Delivery":
        return 4;
      case "Delivered":
        return 5;
      default:
        return 1;
    }
  };

  // ✅ Open Return Modal
  const openReturnModal = (order) => {
    setSelectedOrder(order);
    setReturnType("Refund");
    setReturnReason("Wrong Product Received");
    setReturnMessage("");
    setShowReturnModal(true);
  };

  // ✅ Submit Return Request (Refund / Exchange)
  const submitReturnRequest = () => {
    if (!selectedOrder) return;

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    const updatedOrders = orders.map((o) =>
      o.id === selectedOrder.id
        ? {
            ...o,
            returnStatus: "Return Requested",
            returnRequest: {
              type: returnType,
              reason: returnReason,
              message: returnMessage,
              date: new Date().toLocaleString(),
            },
          }
        : o,
    );

    saveOrders(updatedOrders);

    // ✅ ALSO CREATE CUSTOMER SUPPORT QUERY
    const supportQueries =
      JSON.parse(localStorage.getItem("dezaSupportQueries")) || [];

    supportQueries.push({
      id: Date.now(),
      orderId: selectedOrder.id,
      userName: currentUser?.name || "Customer",
      email: currentUser?.email || "N/A",
      type: "Return Request",
      returnType: returnType,
      reason: returnReason,
      message: returnMessage,
      status: "Pending",
      date: new Date().toLocaleString(),
    });

    localStorage.setItem("dezaSupportQueries", JSON.stringify(supportQueries));

    alert("✅ Return Request Sent Successfully to Admin & Support!");

    setShowReturnModal(false);
    setSelectedOrder(null);
  };

  // 💰 Refund Request (Direct without return)
  const requestRefund = (id) => {
    if (!window.confirm("Do you want to request REFUND for this order?"))
      return;

    const updatedOrders = orders.map((o) =>
      o.id === id
        ? {
            ...o,
            refundStatus: "Refund Requested",
            refundRequestDate: new Date().toLocaleString(),
          }
        : o,
    );

    saveOrders(updatedOrders);
    alert("✅ Refund Request Sent to Admin!");
  };

  return (
    <div className="orders-page">
      <h1 className="orders-title">📦 My Orders</h1>

      {orders.length === 0 ? (
        <p className="empty-msg">No Orders Yet 💛</p>
      ) : (
        <div className="orders-grid">
          {orders.map((o) => (
            <div className="order-card" key={o.id}>
              <div className="order-head">
                <h2>Order #{o.id}</h2>
                <span className="order-status">{o.status || "Placed"}</span>
              </div>

              <p>
                <b>Date:</b> {o.date || "N/A"}
              </p>
              <p>
                <b>Total:</b> ₹{o.total || 0}
              </p>
              <p>
                <b>Payment:</b> {o.paymentMethod || "N/A"}
              </p>

              {/* ✅ Return Refund Status */}
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

              {/* ✅ Progress Bar */}
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
                    className={`progress-step ${
                      index < getProgressStep(o.status) ? "active" : ""
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>

              {/* ❌ Cancel only before Delivered */}
              {o.status !== "Delivered" && (
                <button
                  className="cancel-btn"
                  onClick={() => cancelOrder(o.id)}
                >
                  Cancel Order
                </button>
              )}

              {/* ✅ Return / Refund Buttons after Delivered */}
              {o.status === "Delivered" && (
                <div
                  style={{ display: "flex", gap: "10px", marginTop: "12px" }}
                >
                  <button
                    className="cancel-btn"
                    style={{ background: "#444" }}
                    onClick={() => openReturnModal(o)}
                    disabled={o.returnStatus === "Return Requested"}
                  >
                    {o.returnStatus === "Return Requested"
                      ? "Return Requested ✅"
                      : "Request Return"}
                  </button>

                  <button
                    className="cancel-btn"
                    style={{ background: "#d4af37", color: "#111" }}
                    onClick={() => requestRefund(o.id)}
                    disabled={o.refundStatus === "Refund Requested"}
                  >
                    {o.refundStatus === "Refund Requested"
                      ? "Refund Requested ✅"
                      : "Request Refund"}
                  </button>
                </div>
              )}

              {/* Items */}
              <div className="order-items">
                {(o.items || []).map((item) => (
                  <div
                    key={`${item.id}-${item.selectedSize}`}
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

      {/* ✅ RETURN MODAL */}
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
