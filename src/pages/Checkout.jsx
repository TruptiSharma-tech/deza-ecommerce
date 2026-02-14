import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const cart = JSON.parse(localStorage.getItem("deza_cart")) || [];

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
    if (!name || !/^[a-zA-Z\s]+$/.test(name)) {
      alert("⚠ Enter valid name!");
      return false;
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      alert("⚠ Enter valid 10-digit phone!");
      return false;
    }

    if (!address || address.trim().length < 10) {
      alert("⚠ Enter full address!");
      return false;
    }

    if (cart.length === 0) {
      alert("⚠ Cart empty!");
      return false;
    }

    return true;
  };

  const handleProceedPayment = () => {
    if (!validateForm()) return;

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

    navigate("/payment");
  };

  return (
    <div className="checkout-page">
      <h1 className="checkout-title">Checkout</h1>

      <div className="checkout-wrap">
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

        <div className="checkout-summary">
          <h2>Order Summary</h2>

          {cart.length === 0 ? (
            <p className="empty-msg">Your cart is empty 💛</p>
          ) : (
            <div className="checkout-items">
              {cart.map((item) => (
                <div
                  className="checkout-item"
                  key={`${item.id}-${item.selectedSize}`}
                >
                  <img src={item.image} alt={item.name} />
                  <div>
                    <p className="item-name">{item.name}</p>
                    <p>Size: {item.selectedSize}</p>
                    <p>Qty: {item.qty}</p>
                    <p className="item-price">₹{item.price * item.qty}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 className="checkout-total">Total: ₹{totalAmount}</h3>

          <button className="checkout-btn" onClick={handleProceedPayment}>
            Proceed to Payment →
          </button>
        </div>
      </div>
    </div>
  );
}
