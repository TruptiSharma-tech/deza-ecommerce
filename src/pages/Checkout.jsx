import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getCart, getUserEmail, setCart } from "../utils/userStorage";
import { calculateShipping } from "../utils/shipping";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();

  // Get cart safely (user-scoped)
  const cart = getCart(getUserEmail());

  // Get previous checkout info
  const prevInfo = JSON.parse(localStorage.getItem("checkoutInfo")) || {};

  const [name, setName] = useState(prevInfo.name || "");
  const [phone, setPhone] = useState(
    prevInfo.phone ? prevInfo.phone.replace("+91", "") : "",
  );
  const [email, setEmail] = useState(prevInfo.email || "");

  // ✅ Professional Address Object
  const [address, setAddress] = useState(
    prevInfo.address || {
      street: "",
      area: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
  );

  const [shippingCharges, setShippingCharges] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [shippingStatus, setShippingStatus] = useState("");

  // Calculate Subtotal
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  // Auto-calculate shipping when pincode changes
  useEffect(() => {
    if (address.pincode.length === 6) {
      handleShippingCalculation(address.pincode);
    } else {
      setShippingCharges(0);
      setShippingStatus("");
    }
  }, [address.pincode]);

  const handleShippingCalculation = async (pin) => {
    setIsCalculating(true);
    setShippingStatus("Calculating shipping...");
    const res = await calculateShipping(pin);
    if (res.success) {
      setShippingCharges(res.charge);
      setAddress(prev => ({
        ...prev,
        city: res.city,
        state: res.state
      }));
      setShippingStatus(`🚚 Shipping to ${res.city}: ₹${res.charge}`);
      toast.success(`Shipping calculated for ${res.city}`);
    } else {
      setShippingCharges(0);
      setShippingStatus(`❌ ${res.message}`);
      toast.error(res.message);
    }
    setIsCalculating(false);
  };

  // Validation
  const validateForm = () => {
    if (!name || name.trim().length === 0 || !/^[a-zA-Z\s]+$/.test(name)) {
      toast.error("Enter a valid full name!");
      return false;
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      toast.error("Enter a valid 10-digit phone number!");
      return false;
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Enter a valid email address!");
      return false;
    }

    if (
      !address.street || !address.street.trim() ||
      !address.city || !address.city.trim() ||
      !address.state || !address.state.trim() ||
      !address.pincode || !address.pincode.trim()
    ) {
      toast.error("Please fill complete shipping address!");
      return false;
    }

    if (!/^\d{6}$/.test(address.pincode)) {
      toast.error("Enter valid 6-digit pincode!");
      return false;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty!");
      return false;
    }

    return true;
  };

  const handleProceedPayment = () => {
    if (!validateForm()) return;

    const checkoutData = {
      name,
      phone: "+91" + phone,
      email,
      address,
      cart,
      subtotal: subtotal,
      shipping: shippingCharges,
      total: subtotal + shippingCharges,
    };

    localStorage.setItem("checkoutInfo", JSON.stringify(checkoutData));
    navigate("/payment");
  };

  return (
    <div className="checkout-page">
      <h1 className="checkout-title">Checkout</h1>

      <div className="checkout-wrap">
        {/* LEFT SIDE */}
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

          <input
            type="email"
            placeholder="Email Address (for order confirmation)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <h2>Shipping Address</h2>

          <input
            type="text"
            placeholder="House No / Building"
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
          />

          <input
            type="text"
            placeholder="Area / Locality"
            value={address.area}
            onChange={(e) => setAddress({ ...address, area: e.target.value })}
          />

          <div className="row">
            <input
              type="text"
              placeholder="Pincode"
              maxLength={6}
              value={address.pincode}
              onChange={(e) =>
                setAddress({
                  ...address,
                  pincode: e.target.value.replace(/\D/g, ""),
                })
              }
            />
            
            <input
              type="text"
              placeholder="City"
              value={address.city}
              readOnly
              className="readonly-input"
            />
          </div>

          <div className="row">
            <input
              type="text"
              placeholder="State"
              value={address.state}
              readOnly
              className="readonly-input"
            />

            <input
              type="text"
              placeholder="Country"
              value={address.country}
              readOnly
            />
          </div>
          
          {shippingStatus && (
            <p className={`shipping-status ${shippingStatus.includes("❌") ? "error" : "success"}`}>
              {shippingStatus}
            </p>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="checkout-summary">
          <h2>Order Summary</h2>

          {cart.length === 0 ? (
            <p className="empty-msg">Your cart is empty 💛</p>
          ) : (
            <div className="checkout-items">
              {cart.map((item) => (
                <div
                  className="checkout-item"
                  key={`${item._id}-${item.selectedSize}`}
                >
                  <img src={item.image} alt={item.name} />

                  <div>
                    <p className="item-name">{item.name}</p>
                    <p>Size: {item.selectedSize}</p>
                    <p>Qty: {item.qty}</p>
                    <p className="item-price">₹{(item.price * item.qty).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="summary-details">
            <div className="summary-row">
              <span>Product Price:</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="summary-row">
              <span>Shipping Fee:</span>
              <span>{shippingCharges === 0 ? (isCalculating ? "Calculating..." : "₹0") : `₹${shippingCharges}`}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <span>₹{(subtotal + shippingCharges).toLocaleString("en-IN")}</span>
            </div>
          </div>

          <button className="checkout-btn" onClick={handleProceedPayment} disabled={isCalculating}>
            {isCalculating ? "Calculating Shipping..." : "Proceed to Payment →"}
          </button>
        </div>
      </div>
    </div>
  );
}

