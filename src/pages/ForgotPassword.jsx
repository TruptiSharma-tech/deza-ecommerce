import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("❌ Please enter a valid email address!");
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                setSubmitted(true);
            } else {
                alert("❌ " + data.error);
            }
        } catch (err) {
            alert("❌ Error connecting to server.");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2 className="auth-title">Reset Password</h2>

                {!submitted ? (
                    <>
                        <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "20px", fontSize: "14px" }}>
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                        <form className="auth-form" onSubmit={handleSubmit}>
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button type="submit" className="auth-btn">
                                Send Reset Link
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="success-message" style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "50px", marginBottom: "15px" }}>📩</div>
                        <h3 style={{ color: "#d4af37", marginBottom: "10px" }}>Check Your Email</h3>
                        <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "20px", fontSize: "14px" }}>
                            A reset link has been sent to <strong>{email}</strong>.
                            <br /><br />
                            <span style={{ fontSize: "12px", fontStyle: "italic" }}>
                                (For this demo, you can click the button below to proceed)
                            </span>
                        </p>
                        <Link to={`/reset-password?email=${email}`} className="auth-btn" style={{ display: "block", textDecoration: "none" }}>
                            Go to Reset Page
                        </Link>
                    </div>
                )}

                <p className="auth-footer" style={{ marginTop: "20px" }}>
                    Remember your password? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
}
