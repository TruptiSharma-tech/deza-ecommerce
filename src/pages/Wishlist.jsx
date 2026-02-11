import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Wishlist.css";
import { FaShoppingCart, FaTrash } from "react-icons/fa";

export default function Wishlist() {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("dezaWishlist")) || [];
    setWishlist(stored);
  }, []);

  const removeFromWishlist = (id) => {
    const updated = wishlist.filter((item) => String(item.id) !== String(id));
    setWishlist(updated);
    localStorage.setItem("dezaWishlist", JSON.stringify(updated));
  };

  // ✅ ADD TO CART FROM WISHLIST
  const addToCart = (item) => {
    const cart = JSON.parse(localStorage.getItem("deza_cart")) || [];

    // Check if product already exists with same size
    const existing = cart.find(
      (c) =>
        String(c.id) === String(item.id) &&
        c.selectedSize === (item.selectedSize || item.sizes?.[0]),
    );

    const selectedSize = item.selectedSize || item.sizes?.[0] || "";

    if (!selectedSize) {
      return alert("Please select a size in product page first 😭");
    }

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        selectedSize: selectedSize,
        qty: 1,
      });
    }

    localStorage.setItem("deza_cart", JSON.stringify(cart));

    // ✅ Navigate to cart page
    navigate("/cart");
  };

  return (
    <div className="wishlist-page">
      <h1>Your Wishlist</h1>
      {wishlist.length === 0 ? (
        <p>Your wishlist is empty 😢</p>
      ) : (
        <div className="wishlist-items">
          {wishlist.map((item) => (
            <div key={item.id} className="wishlist-card">
              <img src={item.image} alt={item.name} />
              <div className="wishlist-info">
                <h3>{item.name}</h3>
                <p>₹{item.price}</p>
              </div>

              <div className="wishlist-actions">
                <button
                  className="add-cart-btn"
                  onClick={() => addToCart(item)}
                >
                  <FaShoppingCart /> Add to Cart
                </button>
                <button
                  className="remove-btn"
                  onClick={() => removeFromWishlist(item.id)}
                >
                  <FaTrash /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
