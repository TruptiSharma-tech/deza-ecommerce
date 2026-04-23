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
  const [uiType, setUiType] = useState(""); // "success" | "error" | "info"
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const timerRef = React.useRef(null);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const showMsg = (msg, type = "error") => {
    setUiMessage(msg);
    setUiType(type);
  };

  const handleSendOtp = () => {
    if (!formData.name || formData.name.trim().length < 3) {
      showMsg("❌ Full name must be at least 3 characters.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      showMsg("❌ Please enter a valid email address.");
      return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!formData.password || !strongPasswordRegex.test(formData.password)) {
      showMsg("❌ Password must be 8+ characters with uppercase, lowercase, number & special character.");
      return;
    }

    // Clean and validate phone
    const cleanNumber = formData.contact.replace(/\D/g, "");
    if (cleanNumber.length < 10 || cleanNumber.length > 12) {
      showMsg("❌ Please enter a valid 10-digit mobile number (with or without +91).");
      return;
    }

    // Normalize: keep only the last 10 digits
    const normalized = cleanNumber.slice(-10);
    setFormData(prev => ({ ...prev, contact: normalized }));

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpSent(true);
    setOtpVerified(false);
    setOtp("");
    showMsg(`📩 OTP sent to your registered number! Check your device. (Demo OTP: ${newOtp})`, "info");
    setTimer(60);

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
  };

  const handleVerifyOtp = () => {
    if (!generatedOtp) {
      showMsg("⚠️ Please request an OTP first.");
      return;
    }
    if (timer === 0) {
      showMsg("❌ OTP has expired. Please resend.");
      return;
    }
    if (otp.trim() === generatedOtp) {
      setOtpVerified(true);
      showMsg("✅ Phone verified successfully! Please complete your profile below.", "success");
      if (timerRef.current) clearInterval(timerRef.current);
      setTimer(0);
    } else {
      showMsg("❌ Incorrect OTP. Please try again.");
    }
  };

  const generateStrongPassword = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const nums = "0123456789";
    const specials = "!@#$%^&*()_+";
    const charset = upper + lower + nums + specials;

    let password = "";
    password += upper[Math.floor(Math.random() * upper.length)];
    password += lower[Math.floor(Math.random() * lower.length)];
    password += nums[Math.floor(Math.random() * nums.length)];
    password += specials[Math.floor(Math.random() * specials.length)];

    for (let i = 0; i < 10; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    setFormData({ ...formData, password });
    toast.success("Strong password generated! Make sure to save it. 🔐");
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
      showMsg("⚠️ Please verify your phone number first.");
      return;
    }

    if (!formData.gender) {
      showMsg("❌ Please select your gender.");
      return;
    }

    if (!formData.dob) {
      showMsg("❌ Please select your Date of Birth.");
      return;
    }

    const birthDate = new Date(formData.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    if (age < 10) {
      showMsg("❌ You must be at least 10 years old to register.");
      return;
    }
    if (age > 120) {
      showMsg("❌ Please enter a valid Date of Birth.");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData, contact: `+91 ${formData.contact}` };
      const data = await apiRegister(payload);

      // Clear guest/stale localStorage data
      ["deza_cart", "deza_wishlist", "lastOrder", "checkoutInfo", "dezaOrders"].forEach(k =>
        localStorage.removeItem(k)
      );
      window.dispatchEvent(new Event("cartUpdate"));

      login(data.user, data.token);
      toast.success("🎉 Welcome to DEZA! Your account is ready.");
      navigate("/");
    } catch (err) {
      showMsg("❌ " + (err.message || "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(formData.password);
  const strengthColors = ["#555", "#f44336", "#ff9800", "#ffc107", "#4caf50"];
  const strengthLabels = ["", "Very Weak", "Weak", "Medium", "Strong ✓"];

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>

        {uiMessage && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '20px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              lineHeight: '1.5',
              textAlign: 'left',
              background: uiType === "success"
                ? 'rgba(76, 175, 80, 0.1)'
                : uiType === "info"
                  ? 'rgba(212, 175, 55, 0.1)'
                  : 'rgba(255, 0, 0, 0.08)',
              color: uiType === "success"
                ? '#4CAF50'
                : uiType === "info"
                  ? '#d4af37'
                  : '#ff5252',
              border: `1px solid ${uiType === "success"
                ? 'rgba(76, 175, 80, 0.25)'
                : uiType === "info"
                  ? 'rgba(212, 175, 55, 0.3)'
                  : 'rgba(255, 0, 0, 0.2)'}`,
            }}
          >
            {uiMessage}
            {uiType === "error" && (
              <button
                type="button"
                onClick={() => setUiMessage("")}
                style={{
                  display: 'block',
                  marginTop: '8px',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: '1px solid currentColor',
                  background: 'transparent',
                  color: 'inherit',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                Dismiss ✕
              </button>
            )}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Full Name */}
          <input
            type="text"
            name="name"
            placeholder="Full Name (min. 3 characters)"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={otpSent && !otpVerified}
            autoComplete="name"
          />

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={otpSent && !otpVerified}
            autoComplete="email"
          />

          {/* Password */}
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Create Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={otpSent && !otpVerified}
              autoComplete="new-password"
              style={{ paddingLeft: '42px', paddingRight: '90px' }}
            />
            <button
              type="button"
              className="show-hide-btn"
              onClick={() => setShowPassword(p => !p)}
              title={showPassword ? "Hide Password" : "Show Password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
            <button
              type="button"
              className="suggest-pass-btn"
              onClick={generateStrongPassword}
              disabled={otpSent && !otpVerified}
            >
              Suggest ✨
            </button>
          </div>

          {/* Password Strength Meter */}
          {formData.password && (
            <div className="strength-meter">
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    height: '4px',
                    flex: 1,
                    background: i <= strength ? strengthColors[strength] : 'rgba(255,255,255,0.1)',
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

          {/* OTP Section */}
          <div className="otp-section">
            <div className="contact-input-wrapper">
              <input
                type="tel"
                name="contact"
                placeholder="Mobile Number (e.g. 9820012345)"
                value={formData.contact}
                onChange={handleChange}
                required
                maxLength={13}
                disabled={otpSent}
                autoComplete="tel"
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
                      autoFocus
                      inputMode="numeric"
                      style={{ letterSpacing: '6px', textAlign: 'center', fontSize: '20px' }}
                    />
                    <div className="otp-timer-info">
                      Expires in: <span style={{ color: timer <= 10 ? '#f44336' : '#d4af37', fontWeight: 'bold' }}>{timer}s</span>
                    </div>
                    <button type="button" className="auth-btn" onClick={handleVerifyOtp}>
                      Verify OTP
                    </button>
                  </>
                ) : (
                  <button type="button" className="auth-btn resend-btn" onClick={handleSendOtp}>
                    Resend OTP 🔄
                  </button>
                )}
              </>
            ) : (
              <div className="verified-badge">
                ✓ Phone Verified Successfully
              </div>
            )}
          </div>

          {/* Gender — only show after OTP verified */}
          {otpVerified && (
            <>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other / Prefer not to say</option>
              </select>

              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', paddingLeft: '4px', letterSpacing: '0.5px' }}>
                  DATE OF BIRTH
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                  max={today}
                  min="1900-01-01"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className={`auth-btn ${!otpVerified ? 'disabled' : ''}`}
            disabled={!otpVerified || loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? "Creating Account..." : "Complete Registration →"}
          </button>
        </form>

        <p className="auth-footer">
          Already a member? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}
