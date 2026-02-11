import { Link } from "react-router-dom";
import "./Footer.css";
import { FaPhoneAlt, FaEnvelope } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand */}
        <div className="footer-brand">
          <h2>DEZA</h2>
          <p>
            Luxury fragrances crafted with elegance. Feel premium, smell
            unforgettable.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-links">
          <h3>Quick Links</h3>
          <Link to="/about">About Us</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/admin-login">Admin Login</Link>{" "}
        </div>

        {/* Policies */}
        <div className="footer-links">
          <h3>Policies</h3>
          <Link to="/PrivacyPolicy">Privacy Policy</Link>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/ReturnRefund">Return / Refund Policy</Link>
        </div>

        {/* Support */}
        <div className="footer-links">
          <h3>Contact Support</h3>

          <p className="footer-contact">
            <FaPhoneAlt className="footer-icon" />
            <span>9082710359</span>
          </p>

          <p className="footer-contact">
            <FaEnvelope className="footer-icon" />
            <span>deza9945@gmail.com</span>
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} DEZA. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
