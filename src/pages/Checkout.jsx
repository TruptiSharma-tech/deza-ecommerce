// pages/Checkout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const cart = JSON.parse(localStorage.getItem("deza_cart")) || [];

  // Load previous info from localStorage
  const prevInfo = JSON.parse(localStorage.getItem("checkoutInfo")) || {};

  const [name, setName] = useState(prevInfo.name || "");
  const [phone, setPhone] = useState(
    prevInfo.phone ? prevInfo.phone.replace("+91", "") : "",
  );
  const [address, setAddress] = useState(prevInfo.address || "");

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  const validateForm = () => {
    // Name validation: only letters and spaces
    if (!name || !/^[a-zA-Z\s]+$/.test(name)) {
      alert("⚠ Please enter a valid name (letters only).");
      return false;
    }

    // Phone validation: exactly 10 digits
    if (!phone || !/^\d{10}$/.test(phone)) {
      alert("⚠ Please enter a valid 10-digit phone number.");
      return false;
    }

    // Address validation: minimum 10 chars
    if (!address || address.trim().length < 10) {
      alert("⚠ Please enter a valid address (at least 10 characters).");
      return false;
    }

    if (cart.length === 0) {
      alert("⚠ Cart is empty!");
      return false;
    }

    return true;
  };

  const handleProceedPayment = () => {
    if (!validateForm()) return;

    // Save customer details + cart info to localStorage
    localStorage.setItem(
      "checkoutInfo",
      JSON.stringify({
        name,
        phone: "+91" + phone,
        address,
        cart,
        total: totalAmount,
      }),
    );

    navigate("/payment"); // go to PaymentGateway
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-container">
        {/* Customer Details */}
        <div className="checkout-form">
          <h2>Customer Details</h2>

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))
            }
          />

          <div className="phone-input-wrapper">
            <span className="country-code">+91</span>
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              maxLength={10}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <textarea
            placeholder="Full Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {/* Cart Summary */}
        <div className="cart-summary">
          <h2>Your Products</h2>
          {cart.length === 0 ? (
            <p className="empty-msg">Your cart is empty 💛</p>
          ) : (
            <div className="cart-items">
              {cart.map((item) => (
                <div
                  className="cart-item"
                  key={`${item.id}-${item.selectedSize}`}
                >
                  <img src={item.image} alt={item.name} />
                  <div className="item-details">
                    <p className="item-name">{item.name}</p>
                    <p>Size: {item.selectedSize}</p>
                    <p>Qty: {item.qty}</p>
                    <p>₹{item.price * item.qty}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <h3>Total: ₹{totalAmount}</h3>
        </div>

        {/* Proceed to Payment */}
        <button className="checkout-btn" onClick={handleProceedPayment}>
          Proceed to Payment
        </button>
      </div>
    </div>
  );
}
