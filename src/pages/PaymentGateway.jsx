// pages/PaymentGateway.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import "./PaymentGateway.css";

export default function PaymentGateway() {
  const navigate = useNavigate();
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentType, setPaymentType] = useState(""); // "UPI" or "Card"
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const checkoutInfo = JSON.parse(localStorage.getItem("checkoutInfo")) || {};
  const { name, phone, address, cart, total } = checkoutInfo;

  useEffect(() => {
    if (!cart || cart.length === 0) navigate("/checkout");
  }, [cart, navigate]);

  // Dynamically load Razorpay SDK
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // Save order in localStorage
  const saveOrder = (paymentMethod, status, paymentId = "") => {
    const orders = JSON.parse(localStorage.getItem("dezaOrders")) || [];
    const newOrder = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      name,
      phone,
      address,
      paymentMethod,
      items: cart,
      total,
      status,
      paymentId,
    };
    localStorage.setItem("dezaOrders", JSON.stringify([...orders, newOrder]));
    localStorage.removeItem("deza_cart");
    localStorage.removeItem("checkoutInfo");
  };

  // Razorpay payment handler
  const handleRazorpayPayment = async (method) => {
    if (!total || isNaN(total)) return alert("Invalid total amount!");

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) return alert("Razorpay SDK failed to load!");

    try {
      const options = {
        key: "rzp_test_1DP5mmOlF5G5ag",
        amount: total * 100,
        currency: "INR",
        name: "DEZA Store",
        description: `Order Payment via ${method}`,
        handler: function (response) {
          if (!response || !response.razorpay_payment_id) {
            alert("Payment failed or cancelled!");
            return;
          }
          saveOrder(method, "Paid", response.razorpay_payment_id);
          setPaymentDone(true);
          setTimeout(() => navigate("/checkout/success"), 2000);
        },
        prefill: { name, contact: phone, email: "test@example.com" },
        theme: { color: "#D4AF37" },
        modal: { ondismiss: () => alert("Payment cancelled") },
        notes: { payment_type: method },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay error:", err);
      alert("Something went wrong while opening payment gateway!");
    }
  };

  // Cash on delivery
  const handleCOD = () => {
    saveOrder("Cash On Delivery", "Pending");
    setPaymentDone(true);
    setTimeout(() => navigate("/checkout/success"), 2000);
  };

  // Card form submit
  const handleCardSubmit = () => {
    const { cardNumber, expiry, cvv, name: cardName } = cardDetails;
    if (!cardNumber || !expiry || !cvv || !cardName)
      return alert("⚠ Please fill all card details!");
    handleRazorpayPayment("Card");
  };

  return (
    <div className="payment-page">
      {paymentDone && <Confetti />}

      <h1>Choose Payment Method</h1>

      <div className="payment-options">
        <button
          className="payment-btn upi-btn"
          onClick={() => setPaymentType(paymentType === "UPI" ? "" : "UPI")}
        >
          <img src="https://img.icons8.com/color/48/000000/upi.png" alt="UPI" />
          Pay via UPI
        </button>

        <button
          className="payment-btn card-btn"
          onClick={() => setPaymentType(paymentType === "Card" ? "" : "Card")}
        >
          <img
            src="https://img.icons8.com/color/48/000000/bank-card-back-side.png"
            alt="Card"
          />
          Pay via Card
        </button>

        <button className="payment-btn cod-btn" onClick={handleCOD}>
          <img
            src="https://img.icons8.com/color/48/000000/cash-in-hand.png"
            alt="COD"
          />
          Cash On Delivery
        </button>
      </div>

      {/* UPI Options */}
      {paymentType === "UPI" && (
        <div className="upi-options">
          <h3>Select UPI App</h3>
          <div className="upi-btns">
            {[
              {
                id: "gpay",
                name: "Google Pay",
                icon: "https://img.icons8.com/color/48/000000/google-pay-india.png",
              },
              {
                id: "phonepe",
                name: "PhonePe",
                icon: "https://img.icons8.com/color/48/000000/phonepe.png",
              },
              {
                id: "bhim",
                name: "BHIM",
                icon: "https://img.icons8.com/color/48/000000/bhim.png",
              },
            ].map((app) => (
              <button
                key={app.id}
                className="upi-app-btn"
                onClick={() => handleRazorpayPayment("UPI")}
              >
                <img src={app.icon} alt={app.name} />
                {app.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Card Form */}
      {paymentType === "Card" && (
        <div className="card-form">
          <h3>Enter Card Details (Test Card)</h3>
          <input
            type="text"
            placeholder="Card Number"
            maxLength={16}
            value={cardDetails.cardNumber}
            onChange={(e) =>
              setCardDetails({
                ...cardDetails,
                cardNumber: e.target.value.replace(/\D/g, ""),
              })
            }
          />
          <input
            type="text"
            placeholder="MM/YY"
            maxLength={5}
            value={cardDetails.expiry}
            onChange={(e) =>
              setCardDetails({ ...cardDetails, expiry: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="CVV"
            maxLength={3}
            value={cardDetails.cvv}
            onChange={(e) =>
              setCardDetails({
                ...cardDetails,
                cvv: e.target.value.replace(/\D/g, ""),
              })
            }
          />
          <input
            type="text"
            placeholder="Name on Card"
            value={cardDetails.name}
            onChange={(e) =>
              setCardDetails({ ...cardDetails, name: e.target.value })
            }
          />
          <button className="checkout-btn" onClick={handleCardSubmit}>
            Pay ₹{total || 0}
          </button>
        </div>
      )}

      {/* Order Summary */}
      <div className="order-summary">
        <h2>Order Summary</h2>
        <p>
          <b>Name:</b> {name}
        </p>
        <p>
          <b>Phone:</b> {phone}
        </p>
        <p>
          <b>Address:</b> {address}
        </p>
        <p>
          <b>Total Amount:</b> ₹{total || 0}
        </p>

        <h3>Products:</h3>
        {cart &&
          cart.map((item) => (
            <div
              key={`${item.id}-${item.selectedSize}`}
              className="summary-item"
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
    </div>
  );
}
