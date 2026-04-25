import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";
import { FaUserCircle, FaHeart } from "react-icons/fa";
import { ShoppingCart } from "lucide-react";
import AccountSidebar from "./AccountSidebar";
import { useAuth } from "../context/AuthContext";
import { apiGetProducts, apiGetHeroSettings } from "../utils/api";

// 🚀 Preload function for components
const preloadPage = (componentName) => {
  const pages = {
    Home: () => import("../pages/Home"),
    Shop: () => import("../pages/Shop"),
    About: () => import("../pages/About"),
    Orders: () => import("../pages/Orders"),
    Cart: () => import("../pages/Cart"),
  };
  if (pages[componentName]) pages[componentName]();
};

export default function Navbar() {
  const navigate = useNavigate();
  const { user: currentUser, cartCount, setIsAccountSidebarOpen } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const closeDropdowns = () => setMenuOpen(false);
    window.addEventListener("scroll", closeDropdowns);
    return () => {
      window.removeEventListener("scroll", closeDropdowns);
    };
  }, []);

  const isAdmin = currentUser?.isAdmin === true || ["superadmin", "manager", "support", "admin"].includes(currentUser?.role);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* LOGO */}
        <Link to="/" className="navbar-logo">
          DEZA
        </Link>

        {/* DESKTOP LINKS */}
        <div className="navbar-links">
          <Link to="/" onMouseEnter={() => { preloadPage("Home"); apiGetHeroSettings(); }}>Home</Link>
          <Link to="/shop" onMouseEnter={() => { preloadPage("Shop"); apiGetProducts(); }}>Shop</Link>
          <Link to="/about" onMouseEnter={() => preloadPage("About")}>About</Link>
        </div>

        {/* MOBILE SEARCH */}
        <div className="navbar-mobile-search">
          <input type="text" placeholder="Search perfumes..." onFocus={() => navigate("/shop")} />
        </div>

        {/* RIGHT ICONS */}
        <div className="navbar-right">
          {!isAdmin && (
            <>
              <button className="icon-btn hide-on-mobile" onClick={() => navigate("/wishlist")} title="Wishlist">
                <FaHeart className="nav-icon" />
              </button>

              <button className="icon-btn cart-btn hide-on-mobile" onClick={() => navigate("/cart")} title="Cart">
                <ShoppingCart className="nav-icon" color="white" strokeWidth={1.5} size={26} />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
            </>
          )}

          <button className="icon-btn hide-on-mobile" title="My Account" onClick={() => { if (!currentUser) navigate("/login"); else setIsAccountSidebarOpen(true); }}>
            <FaUserCircle className="nav-icon" />
          </button>

          {/* MENU */}
          <div className="menu-dropdown">
            <button className="icon-btn" onClick={() => setMenuOpen(!menuOpen)} title="Menu">
              <div className="hamburger">
                <span></span><span></span><span></span>
              </div>
            </button>

            {menuOpen && (
              <div className="menu-box">
                <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
                <Link to="/shop" onClick={() => setMenuOpen(false)}>Shop</Link>
                <Link to="/about" onClick={() => setMenuOpen(false)}>About Us</Link>
                <Link to="/contact" onClick={() => setMenuOpen(false)}>Support</Link>
                {!isAdmin && <Link to="/orders" onClick={() => setMenuOpen(false)}>My Orders</Link>}
                <Link to="/privacy-policy" onClick={() => setMenuOpen(false)}>Privacy Policy</Link>
                <Link to="/terms" onClick={() => setMenuOpen(false)}>Terms & Conditions</Link>
                <Link to="/return-refund" onClick={() => setMenuOpen(false)}>Return/Refund</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
