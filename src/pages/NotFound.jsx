import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div
            style={{
                minHeight: "80vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "40px 20px",
                background: "#0a0a0a",
                color: "#fff",
            }}
        >
            <div
                style={{
                    fontSize: "120px",
                    fontFamily: "serif",
                    background: "linear-gradient(135deg, #d4af37, #f0d060)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    lineHeight: 1,
                    marginBottom: "16px",
                }}
            >
                404
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "12px", letterSpacing: "2px" }}>
                Page Not Found
            </h1>

            <p style={{ color: "rgba(255,255,255,0.55)", maxWidth: "400px", marginBottom: "36px", lineHeight: 1.6 }}>
                The page you're looking for has drifted away like a beautiful fragrance. Let's
                get you back on track.
            </p>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
                <button
                    onClick={() => navigate("/")}
                    style={{
                        background: "linear-gradient(135deg, #d4af37, #b8952e)",
                        color: "#1a1a1a",
                        border: "none",
                        padding: "14px 32px",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "14px",
                        cursor: "pointer",
                        letterSpacing: "1px",
                    }}
                >
                    🏠 Go Home
                </button>

                <button
                    onClick={() => navigate("/shop")}
                    style={{
                        background: "transparent",
                        color: "#d4af37",
                        border: "1px solid #d4af37",
                        padding: "14px 32px",
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: "pointer",
                        letterSpacing: "1px",
                    }}
                >
                    ✨ Browse Shop
                </button>
            </div>
        </div>
    );
}
