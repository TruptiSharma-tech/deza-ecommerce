import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Wishlist.css";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();

  const STORAGE_KEY = "deza_wishlist";

  useEffect(() => {
    const storedWishlist = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    setWishlist(storedWishlist);
  }, []);

  const handleRemove = (_id) => {
    const updated = wishlist.filter((item) => item._id !== _id);
    setWishlist(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <div className="wishlist-page">
      <h1 className="wishlist-title">❤️ My Wishlist</h1>

      {wishlist.length === 0 ? (
        <p className="empty-wishlist">No items in wishlist 😢</p>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((item) => {
            // 👇 SAME PRICE LOGIC AS SHOP
            const minPrice =
              item.sizePrices && item.sizePrices.length > 0
                ? Math.min(...item.sizePrices.map((s) => Number(s.price)))
                : null;

            return (
              <div className="wishlist-card" key={item._id}>
                <img src={item.image} alt={item.title} />

                <h3>{item.title}</h3>

                <p className="wishlist-price">
                  {minPrice
                    ? `₹ ${minPrice.toLocaleString("en-IN")}`
                    : "Price Not Available"}
                </p>

                <div className="wishlist-btns">
                  <button
                    className="view-btn"
                    onClick={() => navigate(`/product/${item._id}`)}
                  >
                    View Product
                  </button>

                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(item._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
