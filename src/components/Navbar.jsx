import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";
import { FaShoppingCart, FaUserCircle, FaHeart } from "react-icons/fa";
import AccountSidebar from "./AccountSidebar";

export default function Navbar() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    const closeDropdowns = () => {
      setMenuOpen(false);
    };
    window.addEventListener("scroll", closeDropdowns);
    return () => window.removeEventListener("scroll", closeDropdowns);
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* LEFT LOGO */}
          <Link to="/" className="navbar-logo">
            DEZA
          </Link>

          {/* CENTER LINKS */}
          <div className="navbar-links">
            <Link to="/">Home</Link>
            <Link to="/Shop">Shop</Link>
            <Link to="/about">About</Link>

            {/* ADMIN PANEL BUTTON ONLY FOR ADMINS */}
            {currentUser?.isAdmin === true && (
              <button
                className="admin-btn"
                title="Admin Panel"
                onClick={() => navigate("/admin")}
              >
                🛠 Admin Panel
              </button>
            )}
          </div>

          {/* RIGHT ICONS */}
          <div className="navbar-right">
            {/* WISHLIST */}
            <button
              className="icon-btn"
              onClick={() => navigate("/wishlist")}
              title="Wishlist"
            >
              <FaHeart className="nav-icon" />
            </button>

            {/* CART */}
            <button
              className="icon-btn"
              onClick={() => navigate("/cart")}
              title="Cart"
            >
              <FaShoppingCart className="nav-icon" />
            </button>

            {/* PROFILE ICON */}
            <button
              className="icon-btn"
              title="My Account"
              onClick={() => {
                if (!currentUser) {
                  navigate("/login");
                } else {
                  setAccountOpen(true);
                }
              }}
            >
              <FaUserCircle className="nav-icon" />
            </button>

            {/* HAMBURGER MENU */}
            <div className="menu-dropdown">
              <button
                className="icon-btn"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <div className="hamburger">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>

              {menuOpen && (
                <div className="menu-box">
                  <Link to="/"> Home</Link>
                  <Link to="/Shop"> Shop</Link>
                  <Link to="/About">About Us</Link>
                  <Link to="/Checkout">Checkout</Link>
                  <Link to="/PrivacyPolicy">Privacy Policy</Link>
                  <Link to="/Terms">Terms & Conditions</Link>
                  <Link to="/ReturnRefund">Return/Refund</Link>
                  <Link to="/Orders">My Orders</Link>

                  {/* ADMIN PANEL ONLY IF ADMIN */}
                  {currentUser?.isAdmin === true && (
                    <button
                      className="admin-link"
                      onClick={() => navigate("/admin")}
                    >
                      🛠 Admin Panel
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ACCOUNT SIDEBAR */}
      <AccountSidebar
        isOpen={accountOpen}
        onClose={() => setAccountOpen(false)}
      />
    </>
  );
}
