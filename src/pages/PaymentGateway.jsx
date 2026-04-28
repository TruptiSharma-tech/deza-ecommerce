import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { apiCreateOrder, apiCreateRazorpayOrder, apiVerifyRazorpayPayment } from "../utils/api";
import toast from "react-hot-toast";
import { getUserEmail, cartKey } from "../utils/userStorage";
import { useAuth } from "../context/AuthContext";
import "./PaymentGateway.css";

export default function PaymentGateway() {
  const navigate = useNavigate();
  const [paymentDone, setPaymentDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [dummyProcessing, setDummyProcessing] = useState(false);

  const checkoutInfo = JSON.parse(localStorage.getItem("checkoutInfo")) || {};
  const rawTotal = checkoutInfo.total || 0;
  const total = typeof rawTotal === "string" ? Number(rawTotal.replace(/[^0-9.]/g, "")) : Number(rawTotal);
  const { name, phone, email, address, cart = [] } = checkoutInfo;
  const cleanPhone = (phone || "").replace(/\D/g, "");

  const { user: currentUser, clearCart } = useAuth();

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
      const createdOrder = await apiCreateOrder({
        customerId: currentUser?._id || null,
        customerName: name || currentUser?.name || "Guest",
        customerPhone: "+91" + (cleanPhone || phone || ""),
        customerEmail: email || currentUser?.email || "",
        address: address || {},
        items: cart,
        totalPrice: total,
        paymentMethod,
        paymentId,
        paymentStatus,
        status: "Pending",
      });
      // ✅ Save the created order details so OrderSuccess can display them
      localStorage.setItem("lastOrder", JSON.stringify(createdOrder));
      
      // ✅ Use central clearCart method (clears local + remote)
      if (typeof clearCart === "function") {
        await clearCart();
      } else {
        // Fallback if context not ready
        const userEmail = getUserEmail();
        localStorage.removeItem(cartKey(userEmail));
        localStorage.removeItem("deza_cart");
        window.dispatchEvent(new Event("cartUpdate"));
      }
      
      localStorage.removeItem("checkoutInfo");
    } catch (err) {
      console.error("Failed to save order:", err);
      alert("⚠ Order placed but failed to save to database. Contact support.");
    }
  };

  const handleRazorpayPayment = async (selectedType) => {
    try {
      setLoading(true);
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        toast.error("Razorpay SDK failed to load. Check internet.");
        return;
      }

      // 1. Create Order on Backend
      const order = await apiCreateRazorpayOrder({ amount: total });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SdJA8ZBmvE42IN",
        amount: order.amount,
        currency: order.currency,
        name: "DEZA Luxury Store",
        description: `Order #${order.id.slice(-6)} - ${selectedType}`,
        order_id: order.id, // VITAL: Required for UPI/QR to work!
        image: "https://img.icons8.com/color/96/000000/perfume-bottle-2.png",

        handler: async function (response) {
          try {
            // 2. Verify Payment on Backend
            await apiVerifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            console.log("PAYMENT VERIFIED SUCCESS");
            await saveOrder(selectedType, "Paid", response.razorpay_payment_id);
            setPaymentDone(true);
            toast.success("Payment Successful! 🎉");
            setTimeout(() => navigate("/checkout/success", { replace: true }), 1500);
          } catch (verifyErr) {
            toast.error("Payment Verification Failed! Safety breach. Contact Support.");
          }
        },
        prefill: {
          name: name || currentUser?.name || "Customer",
          contact: cleanPhone || "9999999999",
          email: currentUser?.email || "support@deza.com",
          method: selectedType.toLowerCase() === "upi" ? "upi" : "card"
        },
        theme: { color: "#D4AF37" },
        modal: {
          ondismiss: () => setLoading(false)
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error("Payment Failed: " + response.error.description);
      });
      rzp.open();
    } catch (err) {
      console.error("RAZORPAY ERROR:", err);
      toast.error("Failed to initiate payment. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDummyUPIPayment = async () => {
    setDummyProcessing(true);
    setTimeout(async () => {
      try {
        await saveOrder("UPI (Dummy)", "Paid", "DUMMY_UPI_" + Date.now());
        setPaymentDone(true);
        setShowUPIModal(false);
        toast.success("Dummy UPI Payment Successful! 🎉");
        setTimeout(() => navigate("/checkout/success"), 2000);
      } catch (err) {
        toast.error("Failed to save dummy order");
      } finally {
        setDummyProcessing(false);
      }
    }, 2000);
  };

  const handleCOD = async () => {
    setLoading(true);
    try {
      await saveOrder("Cash On Delivery", "Pending");
      setTimeout(() => {
        setPaymentDone(true);
        navigate("/checkout/success", { replace: true });
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      {paymentDone && <Confetti />}

      <h1 className="payment-title">Select <span>Payment</span></h1>

      <div className="payment-options">
        {/* UPI BUTTON */}
        <button
          className="payment-btn upi-btn"
          onClick={() => setShowUPIModal(true)}
          disabled={loading || dummyProcessing}
        >
          <div className="icon-stack">
            <img src="https://img.icons8.com/color/48/000000/upi.png" alt="UPI" />
          </div>
          <div className="btn-info">
            <span className="btn-label">{loading ? "Connecting..." : "UPI / QR Code"}</span>
            <span className="btn-sub">GPay, PhonePe, BHIM</span>
            <div className="mini-icons">
              <img src="https://img.icons8.com/color/48/000000/google-pay.png" alt="GPay" />
              <img src="https://img.icons8.com/color/48/000000/phonepe.png" alt="PhonePe" />
            </div>
          </div>
        </button>

        {/* CARD BUTTON */}
        <button
          className="payment-btn card-btn"
          onClick={() => handleRazorpayPayment("Card")}
          disabled={loading}
        >
          <div className="icon-stack">
            <img src="https://img.icons8.com/color/48/000000/visa.png" alt="Visa" />
          </div>
          <div className="btn-info">
            <span className="btn-label">{loading ? "Connecting..." : "Card Payment"}</span>
            <span className="btn-sub">Debit / Credit Card</span>
            <div className="mini-icons">
              <img src="https://img.icons8.com/color/48/000000/mastercard.png" alt="Mastercard" />
            </div>
          </div>
        </button>

        {/* COD BUTTON */}
        <button
          className="payment-btn cod-btn"
          onClick={handleCOD}
          disabled={loading}
        >
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

      {/* DUMMY UPI MODAL */}
      {showUPIModal && (
        <div className="upi-modal-overlay">
          <div className="upi-modal-content">
            <button className="close-modal" onClick={() => setShowUPIModal(false)}>×</button>
            <h2>Scan to Pay</h2>
            <p className="upi-id-text">deza@dummyupi</p>
            
            <div className="qr-container">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=deza@dummyupi&pn=DEZA%20Luxury&am=${total}&cu=INR`} 
                alt="UPI QR Code" 
                className="qr-code-img"
              />
            </div>
            
            <p className="amount-to-pay">Amount: <span>₹{total}</span></p>

            <button 
              className="simulate-success-btn" 
              onClick={handleDummyUPIPayment}
              disabled={dummyProcessing}
            >
              {dummyProcessing ? "Processing..." : "Simulate Payment Success"}
            </button>
            <p className="test-mode-note">This is a dummy payment for testing purposes.</p>
          </div>
        </div>
      )}
    </div>
  );
}
