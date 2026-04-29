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
  const [selectedMethod, setSelectedMethod] = useState(null); // 'Prepaid' or 'COD'

  const checkoutInfo = JSON.parse(localStorage.getItem("checkoutInfo")) || {};
  const subtotal = checkoutInfo.subtotal || 0;
  const shipping = checkoutInfo.shipping || 0;
  const { name, phone, email, address, cart = [] } = checkoutInfo;
  const cleanPhone = (phone || "").replace(/\D/g, "");

  const { user: currentUser, clearCart } = useAuth();

  // Dynamic Calculations
  const handlingFee = selectedMethod === "Prepaid" ? Math.round(0.02 * (subtotal + shipping)) : 0;
  const codFee = selectedMethod === "COD" ? 50 : 0; // Flat ₹50 COD Fee
  const finalTotal = subtotal + shipping + handlingFee + codFee;

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
        shippingAddress: address || {},
        items: cart,
        totalAmount: finalTotal,
        shippingFee: shipping,
        handlingFee: handlingFee,
        codFee: codFee,
        paymentMethod,
        paymentId,
        paymentStatus,
        status: "Pending",
      });

      localStorage.setItem("lastOrder", JSON.stringify(createdOrder));
      
      if (typeof clearCart === "function") {
        await clearCart();
      } else {
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
    setSelectedMethod("Prepaid");
    try {
      setLoading(true);
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        toast.error("Razorpay SDK failed to load. Check internet.");
        return;
      }

      // Manually calculate to ensure state sync issues don't affect Razorpay
      const prepaidHandling = Math.round(0.02 * (subtotal + shipping));
      const prepaidTotal = subtotal + shipping + prepaidHandling;

      const order = await apiCreateRazorpayOrder({ amount: prepaidTotal });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SdJA8ZBmvE42IN",
        amount: order.amount,
        currency: order.currency,
        name: "DEZA Luxury Store",
        description: `Order #${order.id.slice(-6)} - ${selectedType}`,
        order_id: order.id,
        image: "https://img.icons8.com/color/96/000000/perfume-bottle-2.png",

        handler: async function (response) {
          try {
            await apiVerifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            await saveOrder(selectedType, "Paid", response.razorpay_payment_id);
            setPaymentDone(true);
            toast.success("Payment Successful! 🎉");
            setTimeout(() => navigate("/checkout/success", { replace: true }), 1500);
          } catch (verifyErr) {
            toast.error("Payment Verification Failed!");
          }
        },
        prefill: {
          name: name || currentUser?.name || "Customer",
          contact: cleanPhone || "9999999999",
          email: currentUser?.email || "support@deza.com",
        },
        theme: { color: "#D4AF37" },
        modal: { ondismiss: () => setLoading(false) }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error("Failed to initiate payment.");
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
    setSelectedMethod("COD");
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
        <button
          className={`payment-btn upi-btn ${selectedMethod === 'Prepaid' ? 'active' : ''}`}
          onClick={() => { setSelectedMethod("Prepaid"); setShowUPIModal(true); }}
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

        <button
          className={`payment-btn card-btn ${selectedMethod === 'Prepaid' ? 'active' : ''}`}
          onClick={() => { setSelectedMethod("Prepaid"); handleRazorpayPayment("Card"); }}
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

        <button
          className={`payment-btn cod-btn ${selectedMethod === 'COD' ? 'active' : ''}`}
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
            <div className="fee-row">
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="fee-row">
              <span>Shipping:</span>
              <span>₹{shipping.toLocaleString()}</span>
            </div>
            {handlingFee > 0 && (
              <div className="fee-row">
                <span>Handling Fee (2%):</span>
                <span>₹{handlingFee.toLocaleString()}</span>
              </div>
            )}
            {codFee > 0 && (
              <div className="fee-row">
                <span>COD Fee:</span>
                <span>₹{codFee.toLocaleString()}</span>
              </div>
            )}
            <div className="total-row">
              <p className="total-label">Total Amount</p>
              <p className="total-amount">₹{finalTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="summary-items">
          {cart.map((item, idx) => (
            <div key={`${item.id || idx}-${item.selectedSize}`} className="summary-item">
              <img src={item.image} alt={item.name} />
              <div className="item-text">
                <p className="item-name">{item.name}</p>
                <p className="item-meta">{item.selectedSize} | Qty: {item.qty}</p>
                <p className="item-price">₹{(item.price * item.qty).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showUPIModal && (
        <div className="upi-modal-overlay">
          <div className="upi-modal-content">
            <button className="close-modal" onClick={() => { setShowUPIModal(false); setSelectedMethod(null); }}>×</button>
            <h2>Scan to Pay</h2>
            <p className="upi-id-text">deza@dummyupi</p>
            <div className="qr-container">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=deza@dummyupi&pn=DEZA%20Luxury&am=${finalTotal}&cu=INR`} 
                alt="UPI QR Code" 
                className="qr-code-img"
              />
            </div>
            <p className="amount-to-pay">Amount: <span>₹{finalTotal}</span></p>
            <button 
              className="simulate-success-btn" 
              onClick={handleDummyUPIPayment}
              disabled={dummyProcessing}
            >
              {dummyProcessing ? "Processing..." : "Simulate Payment Success"}
            </button>
            <p className="test-mode-note">Prepaid handling fee (2%) included.</p>
          </div>
        </div>
      )}
    </div>
  );
}
