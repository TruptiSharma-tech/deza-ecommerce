import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";
import { FaUserCircle, FaHeart } from "react-icons/fa";
import { ShoppingCart } from "lucide-react";
import AccountSidebar from "./AccountSidebar";

export default function Navbar() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("deza_cart")) || [];
    const count = cart.reduce((total, item) => total + item.qty, 0);
    setCartCount(count);
  };

  useEffect(() => {
    updateCartCount();
    // Listen for custom event or storage changes
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdate", updateCartCount);

    const closeDropdowns = () => setMenuOpen(false);
    window.addEventListener("scroll", closeDropdowns);
    return () => {
      window.removeEventListener("scroll", closeDropdowns);
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdate", updateCartCount);
    };
  }, []);

  const isAdmin = currentUser?.isAdmin === true;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* LOGO */}
          <Link to="/" className="navbar-logo">
            DEZA
          </Link>

          {/* LINKS */}
          <div className="navbar-links">
            <Link to="/">Home</Link>
            <Link to="/shop">Shop</Link>
            <Link to="/about">About</Link>

            {isAdmin && (
              <button className="admin-btn" onClick={() => navigate("/admin")}>
                🛠 Admin Panel
              </button>
            )}
          </div>

          {/* RIGHT ICONS */}
          <div className="navbar-right">
            {/* ❌ ADMIN ke liye Wishlist + Cart hide */}
            {!isAdmin && (
              <>
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
                  className="icon-btn cart-btn"
                  onClick={() => navigate("/cart")}
                  title="Cart"
                >
                  <ShoppingCart className="nav-icon" color="white" strokeWidth={1.5} size={26} />
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </button>
              </>
            )}

            {/* ✅ PROFILE ICON ALWAYS SHOW */}
            <button
              className="icon-btn"
              title="My Account"
              onClick={() => {
                if (!currentUser) navigate("/login");
                else setAccountOpen(true);
              }}
            >
              <FaUserCircle className="nav-icon" />
            </button>

            {/* MENU */}
            <div className="menu-dropdown">
              <button
                className="icon-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                title="Menu"
              >
                <div className="hamburger">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>

              {menuOpen && (
                <div className="menu-box">
                  <Link to="/" onClick={() => setMenuOpen(false)}>
                    Home
                  </Link>

                  <Link to="/shop" onClick={() => setMenuOpen(false)}>
                    Shop
                  </Link>

                  <Link to="/about" onClick={() => setMenuOpen(false)}>
                    About Us
                  </Link>

                  <Link to="/contact" onClick={() => setMenuOpen(false)}>
                    Support
                  </Link>

                  {/* ❌ Admin ke liye My Orders hide */}
                  {!isAdmin && (
                    <Link to="/orders" onClick={() => setMenuOpen(false)}>
                      My Orders
                    </Link>
                  )}

                  <Link to="/privacy-policy" onClick={() => setMenuOpen(false)}>
                    Privacy Policy
                  </Link>

                  <Link to="/terms" onClick={() => setMenuOpen(false)}>
                    Terms & Conditions
                  </Link>

                  <Link to="/return-refund" onClick={() => setMenuOpen(false)}>
                    Return/Refund
                  </Link>

                  {isAdmin && (
                    <button
                      className="admin-link"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/admin");
                      }}
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
