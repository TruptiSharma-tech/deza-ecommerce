import React, { useEffect, useState } from "react";
import "./Cart.css";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    if (!currentUser) {
      alert("⚠️ Please Login First!");
      navigate("/login");
      return;
    }

    const storedCart = JSON.parse(localStorage.getItem("deza_cart")) || [];
    setCart(storedCart);
  }, []);

  const updateCart = (updated) => {
    setCart(updated);
    localStorage.setItem("deza_cart", JSON.stringify(updated));
  };

  const removeItem = (id, selectedSize) => {
    const updated = cart.filter(
      (item) =>
        !(String(item.id) === String(id) && item.selectedSize === selectedSize),
    );
    updateCart(updated);
  };

  const changeQty = (id, selectedSize, qty) => {
    if (qty < 1) return;

    const updated = cart.map((item) =>
      String(item.id) === String(id) && item.selectedSize === selectedSize
        ? { ...item, qty: qty }
        : item,
    );

    updateCart(updated);
  };

  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shippingCharge = totalPrice > 999 ? 0 : 80;
  const grandTotal = totalPrice + shippingCharge;

  const checkout = () => {
    if (!currentUser) {
      alert("⚠️ Please Login First!");
      navigate("/login");
      return;
    }

    if (cart.length === 0) {
      alert("⚠ Cart is empty!");
      return;
    }

    navigate("/checkout");
  };

  return (
    <div className="cart-page">
      <h1 className="cart-title">🛒 Shopping Bag</h1>

      {cart.length === 0 ? (
        <div className="cart-empty">
          <p className="empty-msg">Your cart is empty 💛</p>
          <button className="back-shop-btn" onClick={() => navigate("/shop")}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cart.map((item) => (
              <div
                key={`${item.id}-${item.selectedSize}`}
                className="cart-card"
              >
                <div className="cart-img-wrap">
                  <img src={item.image} alt={item.name} />
                </div>

                <div className="cart-info">
                  <h3>{item.name}</h3>
                  <p className="meta">Size: {item.selectedSize}</p>
                  <p className="price">₹{item.price}</p>

                  <div className="qty-box">
                    <button
                      onClick={() =>
                        changeQty(item.id, item.selectedSize, item.qty - 1)
                      }
                    >
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button
                      onClick={() =>
                        changeQty(item.id, item.selectedSize, item.qty + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="cart-right">
                  <p className="item-total">₹{item.price * item.qty}</p>

                  <button
                    className="remove-btn"
                    onClick={() => removeItem(item.id, item.selectedSize)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{totalPrice}</span>
            </div>

            <div className="summary-row">
              <span>Shipping</span>
              <span>
                {shippingCharge === 0 ? "FREE" : `₹${shippingCharge}`}
              </span>
            </div>

            <div className="summary-row total-row">
              <span>Total</span>
              <span>₹{grandTotal}</span>
            </div>

            <button className="checkout-btn" onClick={checkout}>
              Proceed to Checkout →
            </button>

            <p className="cart-note">✨ Free delivery on orders above ₹999</p>
          </div>
        </div>
      )}
    </div>
  );
}
