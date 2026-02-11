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

    // Remove the order from the array
    const updatedOrders = orders.filter((o) => o.id !== id);

    setOrders(updatedOrders);

    // Update localStorage (reverse back before saving to keep original order)
    localStorage.setItem(
      "dezaOrders",
      JSON.stringify([...updatedOrders].reverse()),
    );
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
                <b>Payment:</b> {o.paymentMethod}
              </p>
              <h3>Total: ₹{o.total}</h3>

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
