import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    gender: "",
    dob: "",
  });

  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [uiMessage, setUiMessage] = useState(""); // For UI notifications

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOtp = () => {
    const cleanNumber = formData.contact.replace(/\D/g, "");

    if (cleanNumber.length !== 10) {
      setUiMessage("❌ Please enter active 10-digit number");
      return;
    }

    setFormData(prev => ({ ...prev, contact: cleanNumber }));

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpSent(true);
    setOtpVerified(false);

    // Show on UI immediately
    setUiMessage(`📩 OTP SENT: ${newOtp}`);

    // Still try alert as fallback
    setTimeout(() => {
      alert(`DEZA VERIFICATION\nYour OTP is: ${newOtp}`);
    }, 50);
  };

  const handleVerifyOtp = () => {
    if (otp.trim() === generatedOtp && generatedOtp !== "") {
      setOtpVerified(true);
      setUiMessage("✅ Phone Verified Successfully");
    } else {
      setOtpVerified(false);
      setUiMessage("❌ Incorrect OTP. Try again.");
    }
  };

  const handleResetOtp = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtp("");
    setGeneratedOtp("");
    setUiMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otpVerified) {
      setUiMessage("⚠️ Please verify phone first");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.find((u) => u.email === formData.email)) {
      return alert("Error: Account already exists.");
    }

    const newUser = {
      ...formData,
      role: "user",
      verifiedAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    login(newUser);
    alert("🎉 Registration Successful!");
    navigate("/");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>

        {uiMessage && (
          <div className={`ui-message ${uiMessage.includes('❌') || uiMessage.includes('⚠️') ? 'error' : 'success'}`}
            style={{
              padding: '12px',
              marginBottom: '20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              background: uiMessage.includes('✅') || uiMessage.includes('📩') ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 0, 0, 0.1)',
              color: uiMessage.includes('✅') || uiMessage.includes('📩') ? '#d4af37' : '#ff4d4d',
              border: `1px solid ${uiMessage.includes('✅') || uiMessage.includes('📩') ? 'rgba(212, 175, 55, 0.3)' : 'rgba(255, 0, 0, 0.3)'}`
            }}>
            {uiMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={otpSent && !otpVerified}
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={otpSent && !otpVerified}
          />
          <input
            type="password"
            name="password"
            placeholder="Create Password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={otpSent && !otpVerified}
          />

          <div className="otp-section">
            <div className="contact-input-wrapper">
              <input
                type="tel"
                name="contact"
                placeholder="Mobile Number"
                value={formData.contact}
                onChange={handleChange}
                required
                maxLength={10}
                disabled={otpSent}
              />
              {otpSent && !otpVerified && (
                <span className="change-num-link" onClick={handleResetOtp}>
                  Change
                </span>
              )}
            </div>

            {!otpSent ? (
              <button type="button" className="auth-btn" onClick={handleSendOtp}>
                Send Verification OTP
              </button>
            ) : !otpVerified ? (
              <>
                <input
                  type="text"
                  placeholder="Enter 6-Digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  className="auth-btn"
                  onClick={handleVerifyOtp}
                >
                  Verify Now
                </button>
              </>
            ) : (
              <div className="verified-badge">
                ✓ Phone Verified Successfully
              </div>
            )}
          </div>

          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            disabled={otpSent && !otpVerified}
          >
            <option value="">Select Gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
            disabled={otpSent && !otpVerified}
          />

          <button
            type="submit"
            className={`auth-btn ${!otpVerified ? 'disabled' : ''}`}
            disabled={!otpVerified}
          >
            Complete Registration
          </button>
        </form>

        <p className="auth-footer">
          Already a member? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}
