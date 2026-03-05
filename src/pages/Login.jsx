import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiLogin } from "../utils/api";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("❌ Please enter a valid email address!");
      return;
    }
    if (password.trim() === "") {
      setError("❌ Password cannot be empty!");
      return;
    }

    setLoading(true);
    try {
      const data = await apiLogin({ email: email.trim(), password });
      login(data.user, data.token);
      alert("✅ Login Successful! Welcome back.");
      navigate("/");
    } catch (err) {
      setError("❌ " + (err.message || "Invalid Credentials!"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">User Login</h2>

        {error && (
          <div style={{
            padding: '12px', marginBottom: '16px', borderRadius: '12px',
            fontSize: '14px', fontWeight: '600',
            background: 'rgba(255,0,0,0.1)', color: '#ff4d4d',
            border: '1px solid rgba(255,0,0,0.3)'
          }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div style={{ textAlign: 'right', marginTop: '-10px' }}>
            <Link to="/forgot-password" style={{ color: '#d4af37', fontSize: '13px', textDecoration: 'none' }}>
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
