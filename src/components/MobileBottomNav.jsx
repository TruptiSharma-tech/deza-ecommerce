import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaHome, FaSearch, FaShoppingBag, FaHeart, FaUser } from "react-icons/fa";
import { useShop } from "../context/ShopContext";
import AccountSidebar from "./AccountSidebar";
import "./MobileBottomNav.css";

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount, currentUser } = useShop();
  const [accountOpen, setAccountOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <>
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
          className={`nav-item ${accountOpen ? "active" : ""}`}
          onClick={() => {
            if (!currentUser) navigate("/login");
            else setAccountOpen(true);
          }}
        >
          <FaUser />
          <span>Account</span>
        </div>
      </div>

      <AccountSidebar
        isOpen={accountOpen}
        onClose={() => setAccountOpen(false)}
      />
    </>
  );
}
