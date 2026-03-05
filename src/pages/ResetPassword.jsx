import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { apiResetPassword } from "../utils/api";
import "./Auth.css";

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();

    // Extract email from URL parameters
    const params = new URLSearchParams(location.search);
    const email = params.get("email");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        const strongPasswordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
        if (!strongPasswordRegex.test(password)) {
            alert("❌ New password must be min 8 chars with 1 number and 1 special character.");
            return;
        }

        if (password !== confirmPassword) {
            alert("❌ Passwords do not match!");
            return;
        }

        try {
            await apiResetPassword({ email, newPassword: password });
            alert("✅ Password reset successful! You can now login with your new password.");
            navigate("/login");
        } catch (err) {
            alert("❌ " + (err.message || "Failed to reset password."));
        }
    };

    if (!email) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <h2 className="auth-title">Invalid Link</h2>
                    <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "20px" }}>
                        This reset link is invalid or has expired.
                    </p>
                    <Link to="/forgot-password" title="Request new link" className="auth-btn" style={{ display: "block", textDecoration: "none" }}>
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2 className="auth-title">New Password</h2>
                <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "20px", fontSize: "14px" }}>
                    Create a new password for <strong>{email}</strong>
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                    <button type="submit" className="auth-btn">
                        Update Password
                    </button>
                </form>

                <p className="auth-footer" style={{ marginTop: "20px" }}>
                    Back to <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}
