import React, { useEffect, useState } from "react";
import "./Cart.css";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
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

  // ✅ Checkout Page Redirect
  const checkout = () => {
    if (cart.length === 0) {
      alert("⚠ Cart is empty!");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || currentUser.role !== "user") {
      alert("⚠ Please login first!");
      navigate("/login");
      return;
    }

    // ✅ Redirect to checkout page
    navigate("/checkout");
  };

  return (
    <div className="cart-page">
      <h1 className="cart-title">Your Cart</h1>

      {cart.length === 0 ? (
        <p className="empty-msg">🛒 Cart is empty</p>
      ) : (
        <>
          <div className="cart-list">
            {cart.map((item) => (
              <div
                key={`${item.id}-${item.selectedSize}`}
                className="cart-card"
              >
                <img src={item.image} alt={item.name} />

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
                      -
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

                <button
                  className="remove-btn"
                  onClick={() => removeItem(item.id, item.selectedSize)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Total: ₹{totalPrice}</h2>

            {/* ✅ Checkout Button Linking */}
            <button className="checkout-btn" onClick={checkout}>
              Checkout Now
            </button>
          </div>
        </>
      )}
    </div>
  );
}
