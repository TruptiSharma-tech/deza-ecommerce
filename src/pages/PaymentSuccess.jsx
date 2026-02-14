import React from "react";
import { useNavigate } from "react-router-dom";
import "./PaymentSucess.css";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  return (
    <div className="payment-success-page">
      <div className="success-box">
        <h1>✅ Payment Successful</h1>
        <p>Thank you for shopping with DEZA ✨</p>

        <button onClick={() => navigate("/shop")}>Continue Shopping 🛍</button>

        <button onClick={() => navigate("/track-order")}>Track Order 📦</button>
      </div>
    </div>
  );
}
