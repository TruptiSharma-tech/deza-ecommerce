import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();

    const adminEmail = "admin@deza.com";
    const adminPassword = "Deza@123";

    if (
      formData.email.toLowerCase() !== adminEmail.toLowerCase() ||
      formData.password !== adminPassword
    ) {
      return alert("❌ Invalid Admin Credentials!");
    }

    // ✅ Save Admin in LocalStorage
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        name: "DEZA Admin",
        email: adminEmail,
        role: "admin",
        isAdmin: true, // ⭐ IMPORTANT LINE
      }),
    );

    alert("✅ Admin Login Successful!");
    navigate("/admin");
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h2 className="admin-title">Admin Login</h2>
        <p className="admin-subtitle">Login to access Admin Dashboard</p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Admin Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit" className="admin-login-btn">
            Login
          </button>
        </form>

        <p style={{ marginTop: "18px", color: "#f9f7f2" }}>
          Are you a user?{" "}
          <Link to="/login" style={{ color: "#d4af37", fontWeight: "600" }}>
            User Login
          </Link>
        </p>
      </div>
    </div>
  );
}
