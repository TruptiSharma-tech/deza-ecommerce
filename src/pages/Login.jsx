import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { apiLogin } from "../utils/api";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("❌ Please enter a valid email address.");
      return;
    }
    if (password.trim() === "") {
      setError("❌ Password cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiLogin({ email: email.trim().toLowerCase(), password });
      login(data.user, data.token);
      toast.success("Welcome back to DEZA! ✨");
      navigate("/");
    } catch (err) {
      setError("❌ " + (err.message || "Invalid email or password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>

        {error && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            background: 'rgba(255,0,0,0.08)',
            color: '#ff5252',
            border: '1px solid rgba(255,0,0,0.2)',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '16px',
                lineHeight: '1',
                opacity: 0.7,
                flexShrink: 0
              }}
            >✕</button>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{ paddingLeft: '42px' }}
            />
            <button
              type="button"
              className="show-hide-btn"
              onClick={() => setShowPassword(p => !p)}
              title={showPassword ? "Hide Password" : "Show Password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <div style={{ textAlign: 'right', marginTop: '-6px' }}>
            <Link
              to="/forgot-password"
              style={{ color: '#d4af37', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}
            >
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="auth-btn" disabled={loading} style={{ marginTop: '4px' }}>
            {loading ? "Signing In..." : "Login →"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one here</Link>
        </p>
      </div>
    </div>
  );
}
