import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import "./PaymentGateway.css";

export default function PaymentGateway() {
  const navigate = useNavigate();
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentType, setPaymentType] = useState("");

  const checkoutInfo = JSON.parse(localStorage.getItem("checkoutInfo")) || {};
  const { name, phone, address, cart, total } = checkoutInfo;

  useEffect(() => {
    if (!cart || cart.length === 0) navigate("/checkout");
  }, [cart, navigate]);

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

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

  const handleRazorpayPayment = async (method) => {
    if (!total || isNaN(total)) return alert("Invalid total amount!");

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) return alert("Razorpay SDK failed to load!");

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
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleCOD = () => {
    saveOrder("Cash On Delivery", "Pending");
    setPaymentDone(true);
    setTimeout(() => navigate("/checkout/success"), 2000);
  };

  return (
    <div className="payment-page">
      {paymentDone && <Confetti />}

      <h1 className="payment-title">Choose Payment Method</h1>

      <div className="payment-options">
        <button
          className="payment-btn upi-btn"
          onClick={() => {
            setPaymentType("UPI");
            handleRazorpayPayment("UPI");
          }}
        >
          <img src="https://img.icons8.com/color/48/000000/upi.png" alt="UPI" />
          Pay via UPI
        </button>

        <button
          className="payment-btn card-btn"
          onClick={() => {
            setPaymentType("Card");
            handleRazorpayPayment("Card");
          }}
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
        <p className="total">
          <b>Total Amount:</b> ₹{total || 0}
        </p>

        <h3>Products</h3>
        {cart &&
          cart.map((item) => (
            <div
              key={`${item.id}-${item.selectedSize}`}
              className="summary-item"
            >
              <img src={item.image} alt={item.name} />
              <div>
                <p className="pname">{item.name}</p>
                <p>Size: {item.selectedSize}</p>
                <p>Qty: {item.qty}</p>
                <p className="pprice">₹{item.price * item.qty}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
