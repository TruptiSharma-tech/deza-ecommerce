import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { apiRegister } from "../utils/api";
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
  const [uiMessage, setUiMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = React.useRef(null);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOtp = () => {
    if (!formData.name || formData.name.trim().length < 3) {
      setUiMessage("❌ Full name is required and should be at least 3 chars!");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      setUiMessage("❌ Please enter a valid email address!");
      return;
    }
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!formData.password || !strongPasswordRegex.test(formData.password)) {
      setUiMessage("❌ Password must be min 8 chars with uppercase, lowercase, number, and special character.");
      return;
    }

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
    setUiMessage(`📩 OTP SENT: ${newOtp}`);
    setTimer(30);

    // Start 30s Timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      toast.success(`DEZA VERIFICATION\nYour OTP is: ${newOtp}`, { duration: 8000 });
    }, 50);
  };

  const handleVerifyOtp = () => {
    if (timer === 0) {
      setUiMessage("❌ OTP Expired. Please resend.");
      return;
    }
    if (otp.trim() === generatedOtp && generatedOtp !== "") {
      setOtpVerified(true);
      setUiMessage("✅ Phone Verified Successfully");
      if (timerRef.current) clearInterval(timerRef.current);
      setTimer(0);
    } else {
      setOtpVerified(false);
      setUiMessage("❌ Incorrect OTP. Try again.");
    }
  };

  const generateStrongPassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    // Ensure at least one of each required type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*()"[Math.floor(Math.random() * 10)];

    for (let i = 0; i < 12; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the characters
    password = password.split('').sort(() => 0.5 - Math.random()).join('');

    setFormData({ ...formData, password });
    toast.success("Strong password generated! Make sure to save it.");
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const handleResetOtp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setOtpSent(false);
    setOtpVerified(false);
    setOtp("");
    setGeneratedOtp("");
    setUiMessage("");
    setTimer(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpVerified) {
      setUiMessage("⚠️ Please verify phone first");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRegister(formData);
      login(data.user, data.token);
      toast.success("Registration Successful! Welcome to DEZA! 🎉");
      navigate("/");
    } catch (err) {
      setUiMessage("❌ " + (err.message || "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(formData.password);
  const strengthColors = ["#666", "#f44336", "#ff9800", "#ffc107", "#4caf50"];
  const strengthLabels = ["Empty", "Very Weak", "Weak", "Medium", "Strong"];

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

          <div className="password-wrapper" style={{ position: 'relative' }}>
            <input
              type="password"
              name="password"
              placeholder="Create Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={otpSent && !otpVerified}
            />
            <button
              type="button"
              className="suggest-pass-btn"
              onClick={generateStrongPassword}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#d4af37',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Suggest ✨
            </button>
          </div>

          {formData.password && (
            <div className="strength-meter" style={{ marginBottom: '15px', marginTop: '-10px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    height: '4px',
                    flex: 1,
                    background: i <= strength ? strengthColors[strength] : '#eee',
                    borderRadius: '2px',
                    transition: '0.3s'
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '11px', color: strengthColors[strength], fontWeight: 'bold' }}>
                {strengthLabels[strength]}
              </span>
            </div>
          )}

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
                {timer > 0 ? (
                  <>
                    <input
                      type="text"
                      placeholder="Enter 6-Digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      maxLength={6}
                      required
                    />
                    <div className="otp-timer-info">
                      OTP expires in: <span style={{ color: '#d4af37', fontWeight: 'bold' }}>{timer}s</span>
                    </div>
                    <button
                      type="button"
                      className="auth-btn"
                      onClick={handleVerifyOtp}
                    >
                      Verify Now
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="auth-btn resend-btn"
                    onClick={handleSendOtp}
                  >
                    Resend OTP
                  </button>
                )}
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
            disabled={!otpVerified || loading}
          >
            {loading ? "Registering..." : "Complete Registration"}
          </button>
        </form>

        <p className="auth-footer">
          Already a member? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}
