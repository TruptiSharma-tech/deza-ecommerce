import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaSearch, FaShoppingBag, FaHeart, FaUser } from "react-icons/fa";
import { useShop } from "../context/ShopContext";
import "./MobileBottomNav.css";

export default function MobileBottomNav() {
  const location = useLocation();
  const { cartCount } = useShop();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="mobile-bottom-nav">
      <Link to="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
        <FaHome />
        <span>Home</span>
      </Link>
      <Link to="/shop" className={`nav-item ${isActive("/shop") ? "active" : ""}`}>
        <FaSearch />
        <span>Categories</span>
      </Link>
      <Link to="/cart" className={`nav-item ${isActive("/cart") ? "active" : ""}`}>
        <div className="cart-icon-wrapper">
          <FaShoppingBag />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </div>
        <span>Cart</span>
      </Link>
      <Link to="/wishlist" className={`nav-item ${isActive("/wishlist") ? "active" : ""}`}>
        <FaHeart />
        <span>Wishlist</span>
      </Link>
      <Link to="/login" className={`nav-item ${isActive("/login") || isActive("/register") ? "active" : ""}`}>
        <FaUser />
        <span>Account</span>
      </Link>
    </div>
  );
}
