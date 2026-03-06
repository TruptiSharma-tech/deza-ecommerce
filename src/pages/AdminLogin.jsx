import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./AdminLogin.css";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address!");
      return;
    }

    if (!formData.password) {
      toast.error("Password cannot be empty!");
      return;
    }

    const adminEmail = "admin@deza.com";
    const adminPassword = "Admin@Deza2026!";

    if (
      formData.email.toLowerCase() !== adminEmail.toLowerCase() ||
      formData.password !== adminPassword
    ) {
      toast.error("Invalid Admin Credentials!");
      return;
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

    toast.success("Admin Login Successful! 💎");
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
