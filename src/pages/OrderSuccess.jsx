import React from "react";
import "./OrderSucess.css";
import { useNavigate } from "react-router-dom";

export default function OrderSuccess() {
  const navigate = useNavigate();

  return (
    <div className="success-page">
      <div className="success-card">
        <h1>🎉 Order Placed Successfully!</h1>
        <p>Your luxury fragrance is on the way 💛</p>

        <div className="success-btns">
          <button onClick={() => navigate("/Orders")}>View My Orders</button>

          <button className="home-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
