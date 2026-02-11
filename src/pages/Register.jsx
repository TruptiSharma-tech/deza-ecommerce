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

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOtp = () => {
    if (!formData.contact || formData.contact.length < 10) {
      return alert("Enter a valid contact number!");
    }
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpSent(true);
    setOtpVerified(false);
    alert(`📩 OTP: ${newOtp}`);
  };

  const handleVerifyOtp = () => {
    if (otp === generatedOtp) {
      setOtpVerified(true);
      alert("✅ OTP Verified!");
    } else {
      setOtpVerified(false);
      alert("❌ Invalid OTP!");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otpVerified) return alert("Verify OTP first!");

    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.find((u) => u.email === formData.email))
      return alert("User already exists!");

    const newUser = { ...formData, role: "user" };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    login(newUser); // ✅ Login immediately after registration
    alert("Registration Successful!");
    navigate("/"); // redirect to Home
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">NEW USER</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="contact"
            placeholder="Contact Number"
            value={formData.contact}
            onChange={handleChange}
            required
          />
          <button type="button" className="auth-btn" onClick={handleSendOtp}>
            Send OTP
          </button>
          {otpSent && (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-btn"
                style={{
                  background: otpVerified
                    ? "linear-gradient(90deg, #4CAF50, #8BC34A)"
                    : "linear-gradient(90deg, #d4af37, #f3d57a)",
                }}
                onClick={handleVerifyOtp}
              >
                {otpVerified ? "OTP Verified ✅" : "Verify OTP"}
              </button>
            </>
          )}
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
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
          />
          <button type="submit" className="auth-btn">
            Register & Login
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
