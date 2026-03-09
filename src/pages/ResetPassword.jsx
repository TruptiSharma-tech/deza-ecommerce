import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { apiResetPassword } from "../utils/api";
import toast from "react-hot-toast";
import "./Auth.css";

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();

    // ✅ Extract BOTH token and email from URL — token is required for secure reset
    const params = new URLSearchParams(location.search);
    const email = params.get("email");
    const token = params.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const strongPasswordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
        if (!strongPasswordRegex.test(password)) {
            toast.error("Password must be min 8 chars with 1 number and 1 special character.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            // ✅ Now sends token + email + newPassword to backend for secure verification
            await apiResetPassword({ email, token, newPassword: password });
            toast.success("Password reset successful! You can now login. ✨");
            navigate("/login");
        } catch (err) {
            toast.error(err.message || "Invalid or expired reset link. Please request a new one.");
        } finally {
            setLoading(false);
        }
    };

    // Show error if token or email is missing from URL
    if (!email || !token) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <h2 className="auth-title">Invalid Reset Link</h2>
                    <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "20px" }}>
                        This reset link is invalid or has expired. Please request a new one.
                    </p>
                    <Link to="/forgot-password" className="auth-btn" style={{ display: "block", textDecoration: "none", textAlign: "center" }}>
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2 className="auth-title">Set New Password</h2>
                <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "20px", fontSize: "14px" }}>
                    Create a new password for <strong>{email}</strong>
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="New Password (min 8 chars, 1 number, 1 symbol)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>

                <p className="auth-footer" style={{ marginTop: "20px" }}>
                    Back to <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}
