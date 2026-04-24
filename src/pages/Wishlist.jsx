import React from "react";
import { useNavigate } from "react-router-dom";
import "./Wishlist.css";
import { useShop } from "../context/ShopContext";

export default function Wishlist() {
  const navigate = useNavigate();
  const { currentUser, wishlist, updateWishlist } = useShop();

  const handleRemove = (_id) => {
    const updated = wishlist.filter((item) => item._id !== _id);
    updateWishlist(updated);
  };

  // Allow guest wishlist

  return (
    <div className="wishlist-page">
      <h1 className="wishlist-title">❤️ My Wishlist</h1>

      {wishlist.length === 0 ? (
        <p className="empty-wishlist">No items in wishlist 😢</p>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((item) => {
            const minPrice =
              item.sizePrices && item.sizePrices.length > 0
                ? Math.min(...item.sizePrices.map((s) => Number(s.price)))
                : null;

            return (
              <div className="wishlist-card" key={item._id}>
                <img src={item.image} alt={item.title || item.name} />
                <h3>{item.title || item.name}</h3>
                <p className="wishlist-price">
                  {minPrice
                    ? `₹ ${minPrice.toLocaleString("en-IN")}`
                    : (item.price ? `₹ ${item.price.toLocaleString("en-IN")}` : "Price Not Available")}
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
