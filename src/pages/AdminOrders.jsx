import React, { useEffect, useState } from "react";
import "./AdminOrders.css";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("dezaOrders")) || [];
    setOrders(stored.reverse());
  }, []);

  const updateStatus = (id, status) => {
    const updated = orders.map((o) => (o.id === id ? { ...o, status } : o));
    localStorage.setItem("dezaOrders", JSON.stringify(updated));
    setOrders(updated);
  };

  return (
    <div className="admin-orders">
      <h1>All Orders</h1>
      {orders.map((o) => (
        <div key={o.id} className="admin-order-card">
          <h2>Order ID: {o.id}</h2>
          <p>User: {o.name}</p>
          <p>
            Payment: {o.paymentMethod} ({o.paymentStatus})
          </p>
          <p>Status: {o.status}</p>
          <h3>Items:</h3>
          {o.items.map((i) => (
            <p key={i.id}>
              {i.name} (Size: {i.selectedSize}) x {i.qty} - ₹{i.price * i.qty}
            </p>
          ))}
          <h3>Total: ₹{o.total}</h3>
          <select
            value={o.status}
            onChange={(e) => updateStatus(o.id, e.target.value)}
          >
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      ))}
    </div>
  );
}
