import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { apiCreateOrder } from "../utils/api";
import "./PaymentGateway.css";

export default function PaymentGateway() {
  const navigate = useNavigate();
  const [paymentDone, setPaymentDone] = useState(false);

  const checkoutInfo = JSON.parse(localStorage.getItem("checkoutInfo")) || {};
  const rawTotal = checkoutInfo.total || 0;
  const total = typeof rawTotal === "string" ? Number(rawTotal.replace(/[^0-9.]/g, "")) : Number(rawTotal);
  const { name, phone, address, cart = [] } = checkoutInfo;
  const cleanPhone = (phone || "").replace(/\D/g, "");

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    if (!cart || cart.length === 0) navigate("/checkout");
  }, [cart, navigate]);

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const saveOrder = async (paymentMethod, paymentStatus, paymentId = "") => {
    try {
      await apiCreateOrder({
        customerId: currentUser?._id || null,
        customerName: name || currentUser?.name || "Guest",
        customerPhone: "+91" + (cleanPhone || phone || ""),
        customerEmail: currentUser?.email || "",
        address: address || {},
        items: cart,
        totalPrice: total,
        paymentMethod,
        paymentId,
        paymentStatus,
        status: "Pending",
        date: new Date().toISOString(),
      });
      // Clear cart
      localStorage.removeItem("deza_cart");
      localStorage.removeItem("checkoutInfo");
    } catch (err) {
      console.error("Failed to save order:", err);
      alert("⚠ Order placed but failed to save to database. Contact support.");
    }
  };

  const handleRazorpayPayment = async (selectedType) => {
    const amountInPaise = Math.round(Number(total) * 100);
    const displayPhone = cleanPhone || "9999999999";

    console.log("[RAZORPAY DEBUG]", { amountInPaise, displayPhone, selectedType });

    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      console.error("CRITICAL ERROR: Invalid Amount detected.");
      return;
    }

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded || !window.Razorpay) {
      alert("FAILED to load Razorpay. Check your internet.");
      return;
    }

    const options = {
      key: "rzp_test_1DP5mmOlF5G5ag",
      amount: amountInPaise,
      currency: "INR",
      name: "DEZA Luxury Store",
      description: `Luxury Fragrance - ${selectedType}`,
      image: "https://img.icons8.com/color/96/000000/perfume-bottle-2.png",

      handler: async function (response) {
        console.log("PAYMENT SUCCESS:", response.razorpay_payment_id);
        await saveOrder(selectedType, "Paid", response.razorpay_payment_id);
        setPaymentDone(true);
        setTimeout(() => navigate("/checkout/success"), 2000);
      },
      prefill: {
        name: name || "Customer",
        contact: displayPhone,
        email: currentUser?.email || "support@deza.com"
      },
      theme: { color: "#D4AF37" },
      modal: {
        ondismiss: function () {
          console.log("Payment window closed.");
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert("Payment Failed: " + response.error.description);
      });
      rzp.open();
    } catch (err) {
      console.error("SDK OPEN ERROR:", err);
      alert("Something went wrong with the payment portal.");
    }
  };

  const handleCOD = async () => {
    await saveOrder("Cash On Delivery", "Pending");
    setPaymentDone(true);
    setTimeout(() => navigate("/checkout/success"), 2000);
  };

  return (
    <div className="payment-page">
      {paymentDone && <Confetti />}

      <h1 className="payment-title">Select <span>Payment</span></h1>

      <div className="payment-options">
        {/* UPI BUTTON */}
        <button className="payment-btn upi-btn" onClick={() => handleRazorpayPayment("UPI")}>
          <div className="icon-stack">
            <img src="https://img.icons8.com/color/48/000000/upi.png" alt="UPI" />
          </div>
          <div className="btn-info">
            <span className="btn-label">UPI / QR Code</span>
            <span className="btn-sub">GPay, PhonePe, BHIM</span>
            <div className="mini-icons">
              <img src="https://img.icons8.com/color/48/000000/google-pay.png" alt="GPay" />
              <img src="https://img.icons8.com/color/48/000000/phonepe.png" alt="PhonePe" />
            </div>
          </div>
        </button>

        {/* CARD BUTTON */}
        <button className="payment-btn card-btn" onClick={() => handleRazorpayPayment("Card")}>
          <div className="icon-stack">
            <img src="https://img.icons8.com/color/48/000000/visa.png" alt="Visa" />
          </div>
          <div className="btn-info">
            <span className="btn-label">Card Payment</span>
            <span className="btn-sub">Debit / Credit Card</span>
            <div className="mini-icons">
              <img src="https://img.icons8.com/color/48/000000/mastercard.png" alt="Mastercard" />
            </div>
          </div>
        </button>

        {/* COD BUTTON */}
        <button className="payment-btn cod-btn" onClick={handleCOD}>
          <div className="icon-stack">
            <img src="https://img.icons8.com/color/48/000000/cash-in-hand.png" alt="COD" />
          </div>
          <div className="btn-info">
            <span className="btn-label">Cash on Delivery</span>
            <span className="btn-sub">Pay at Your Doorstep</span>
          </div>
        </button>
      </div>

      <div className="order-summary">
        <h2>Order Summary</h2>
        <div className="summary-details">
          <div className="customer-info">
            <p><b>Pay To:</b> DEZA Luxury Perfumes</p>
            <p><b>Deliver To:</b> {name || "Guest"}</p>
            <p><b>Contact:</b> {phone}</p>
          </div>
          <div className="price-info">
            <p className="total-label">Total Amount</p>
            <p className="total-amount">₹{total}</p>
          </div>
        </div>

        <div className="summary-items">
          {cart.map((item, idx) => (
            <div key={`${item.id || idx}-${item.selectedSize}`} className="summary-item">
              <img src={item.image} alt={item.name} />
              <div className="item-text">
                <p className="item-name">{item.name}</p>
                <p className="item-meta">{item.selectedSize} | Qty: {item.qty}</p>
                <p className="item-price">₹{item.price * item.qty}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
