import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaHome, FaSearch, FaShoppingBag, FaHeart, FaUser } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "./MobileBottomNav.css";

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount, user: currentUser, isAccountSidebarOpen, setIsAccountSidebarOpen } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="mobile-bottom-nav">
      <Link to="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
        <FaHome />
        <span>Home</span>
      </Link>
      <Link to="/shop" className={`nav-item ${isActive("/shop") ? "active" : ""}`}>
        <FaSearch />
        <span>Shop</span>
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
      <div 
        className={`nav-item ${isAccountSidebarOpen ? "active" : ""}`}
        onClick={() => {
          if (!currentUser) navigate("/login");
          else setIsAccountSidebarOpen(true);
        }}
      >
        <FaUser />
        <span>Account</span>
      </div>
    </div>
  );
}
