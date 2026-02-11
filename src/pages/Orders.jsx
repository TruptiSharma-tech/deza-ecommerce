// pages/Orders.jsx
import React, { useEffect, useState } from "react";
import "./Orders.css";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("dezaOrders")) || [];
    setOrders(stored.reverse());
  }, []);

  const cancelOrder = (id) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    const updatedOrders = orders.filter((o) => o.id !== id);
    setOrders(updatedOrders);
    localStorage.setItem(
      "dezaOrders",
      JSON.stringify([...updatedOrders].reverse()),
    );
  };

  const trackOrder = (status) => {
    alert(`Your order is currently: ${status || "Pending"}`);
  };

  const getProgressStep = (status) => {
    switch (status) {
      case "In Progress":
        return 2;
      case "Shipped":
        return 3;
      case "Delivered":
        return 4;
      default:
        return 1; // Pending
    }
  };

  return (
    <div className="orders-page">
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <p className="empty-msg">No Orders Yet 💛</p>
      ) : (
        <div className="orders-grid">
          {orders.map((o) => (
            <div className="order-card" key={o.id}>
              <h2>Order ID: {o.id}</h2>
              <p>
                <b>Date:</b> {o.date}
              </p>
              <p>
                <b>Total:</b> ₹{o.total}
              </p>
              <p>
                <b>Payment:</b> {o.paymentMethod}
              </p>
              <p>
                <b>Status:</b> {o.status || "Pending"}
              </p>

              {/* Order Progress Bar */}
              <div className="progress-bar-container">
                {["Pending", "In Progress", "Shipped", "Delivered"].map(
                  (step, index) => (
                    <div
                      key={step}
                      className={`progress-step ${
                        index < getProgressStep(o.status) ? "active" : ""
                      }`}
                    >
                      {step}
                    </div>
                  ),
                )}
              </div>

              {/* Track Order Button */}
              <button
                className="track-btn"
                onClick={() => trackOrder(o.status)}
              >
                Track Order
              </button>

              <div className="order-items">
                {o.items.map((item) => (
                  <div
                    key={`${item.id}-${item.selectedSize}`}
                    className="order-item"
                  >
                    <img src={item.image} alt={item.name} />
                    <div>
                      <p>{item.name}</p>
                      <p>Size: {item.selectedSize}</p>
                      <p>Qty: {item.qty}</p>
                      <p>₹{item.price * item.qty}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cancel Order Button */}
              <button className="cancel-btn" onClick={() => cancelOrder(o.id)}>
                Cancel Order
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
