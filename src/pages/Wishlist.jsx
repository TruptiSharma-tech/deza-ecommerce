import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Wishlist.css";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedWishlist =
      JSON.parse(localStorage.getItem("dezaWishlist")) || [];
    setWishlist(storedWishlist);
  }, []);

  const handleRemove = (id) => {
    const updated = wishlist.filter((item) => item.id !== id);
    setWishlist(updated);
    localStorage.setItem("dezaWishlist", JSON.stringify(updated));
  };

  return (
    <div className="wishlist-page">
      <h1 className="wishlist-title">❤️ My Wishlist</h1>

      {wishlist.length === 0 ? (
        <p className="empty-wishlist">No items in wishlist 😢</p>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((item) => (
            <div className="wishlist-card" key={item.id}>
              <img src={item.image} alt={item.title} />

              <h3>{item.title}</h3>
              <p className="wishlist-price">₹{item.price}</p>

              <div className="wishlist-btns">
                <button
                  className="view-btn"
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  View
                </button>

                <button
                  className="remove-btn"
                  onClick={() => handleRemove(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
