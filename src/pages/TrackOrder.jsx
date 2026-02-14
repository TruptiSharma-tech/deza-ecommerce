import React, { useEffect, useState } from "react";
import "./TrackOrder.css";
import { useParams, useNavigate } from "react-router-dom";

export default function TrackOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const storedOrders = JSON.parse(localStorage.getItem("dezaOrders")) || [];
    const found = storedOrders.find((o) => String(o.id) === String(id));

    if (!found) {
      alert("Order not found!");
      navigate("/orders");
      return;
    }

    setOrder(found);
  }, [id, navigate]);

  if (!order) return null;

  const steps = [
    "Placed",
    "Packed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];

  const getStepIndex = () => {
    switch (order.status) {
      case "Packed":
        return 1;
      case "Shipped":
        return 2;
      case "Out for Delivery":
        return 3;
      case "Delivered":
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex();

  return (
    <div className="track-page">
      <h1 className="track-title">Track Your Order</h1>

      <div className="track-card">
        <h2>Order #{order.id}</h2>
        <p>
          <b>Date:</b> {order.date}
        </p>
        <p>
          <b>Total:</b> ₹{order.total}
        </p>
        <p>
          <b>Payment:</b> {order.paymentMethod}
        </p>

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

        <button className="back-orders-btn" onClick={() => navigate("/orders")}>
          Back to Orders
        </button>
      </div>
    </div>
  );
}
