import React, { useEffect, useState } from "react";
import "./TrackOrder.css";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function TrackOrder() {
  const { orderId } = useParams();     // ✅ matches route /track-order/:orderId
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("deza_token");
      const res = await fetch(`${API_URL}/orders/track/${encodeURIComponent(orderId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        toast.error("Order not found!");
        navigate("/orders");
        return;
      }

      const data = await res.json();
      setOrder(data);
    } catch (err) {
      console.error("Track order error:", err);
      toast.error("Could not load order. Please try again.");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Placed", "Packed", "Shipped", "Out for Delivery", "Delivered"];

  const getStepIndex = (status) => {
    const map = { Packed: 1, Shipped: 2, "Out for Delivery": 3, Delivered: 4 };
    return map[status] ?? 0;
  };

  if (loading) {
    return (
      <div className="track-page">
        <div style={{ textAlign: "center", padding: "80px", color: "#d4af37", fontSize: "18px" }}>
          Loading order details...
        </div>
      </div>
    );
  }

  if (!order) return null;

  const currentStep = getStepIndex(order.status);

  return (
    <div className="track-page">
      <h1 className="track-title">Track Your Order</h1>

      <div className="track-card">
        <h2>Order #{order.orderId || order._id}</h2>
        <p>
          <b>Date:</b> {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
        </p>
        <p>
          <b>Total:</b> ₹{order.totalPrice?.toLocaleString("en-IN")}
        </p>
        <p>
          <b>Payment:</b> {order.paymentMethod}
        </p>
        <p>
          <b>Status:</b>{" "}
          <span style={{ color: order.status === "Cancelled" ? "#ff4b4b" : "#d4af37", fontWeight: "bold" }}>
            {order.status}
          </span>
        </p>

        {order.status !== "Cancelled" && (
          <div className="track-progress">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`track-step ${index <= currentStep ? "active" : ""}`}
              >
                <div className="circle">{index + 1}</div>
                <p>{step}</p>
              </div>
            ))}
          </div>
        )}

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ color: "#d4af37", marginBottom: "12px" }}>Items</h3>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                {item.image && <img src={item.image} alt={item.name} style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "6px" }} />}
                <div>
                  <p style={{ margin: 0, fontWeight: "bold" }}>{item.name}</p>
                  <p style={{ margin: 0, fontSize: "13px", opacity: 0.7 }}>Size: {item.selectedSize} · Qty: {item.qty} · ₹{item.price?.toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="back-orders-btn" onClick={() => navigate("/orders")}>
          ← Back to Orders
        </button>
      </div>
    </div>
  );
}
