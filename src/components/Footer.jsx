import { Link } from "react-router-dom";
import "./Footer.css";
import { FaPhoneAlt, FaEnvelope, FaPaperPlane } from "react-icons/fa";
import { apiSubscribe } from "../utils/api";
import toast from "react-hot-toast";
import React, { useState } from "react";

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

        {/* Newsletter */}
        <div className="footer-links">
          <h3>Newsletter</h3>
          <p style={{ fontSize: "12px", opacity: 0.7, marginBottom: "10px" }}>Subscribe to get luxury updates.</p>
          <div className="newsletter-form" style={{ display: 'flex', gap: '5px' }}>
            <input 
              type="email" 
              placeholder="Your email..." 
              id="footer-email"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d4af37', background: '#111', color: '#fff', width: '100%' }}
            />
            <button 
              onClick={async () => {
                const email = document.getElementById('footer-email').value;
                if(!email) return toast.error("Enter email first");
                try {
                  await apiSubscribe(email);
                  toast.success("Subscribed to the DEZA Edit! ✨");
                  document.getElementById('footer-email').value = "";
                } catch(e) { toast.error("Already subscribed or error"); }
              }}
              style={{ background: '#d4af37', color: '#111', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
            >
              <FaPaperPlane />
            </button>
          </div>
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
