import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./AdminLogin.css";
import toast from "react-hot-toast";
import { apiAdminLogin } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
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

    try {
      const response = await apiAdminLogin({
        email: formData.email,
        password: formData.password
      });

      // ✅ Use AuthContext Login helper
      login({
        ...response.user,
        isAdmin: true
      }, response.token);

      toast.success("Admin Login Successful! 💎");
      navigate("/admin");
    } catch (err) {
      toast.error(err.message || "Invalid Admin Credentials!");
    }
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
