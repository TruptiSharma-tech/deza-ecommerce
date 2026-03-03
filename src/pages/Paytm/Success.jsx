import React from "react";
import { useLocation, Link } from "react-router-dom";

const Success = () => {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const txnId = query.get("id");

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.icon}>✅</div>
                <h1 style={styles.title}>Payment Successful!</h1>
                <p style={styles.subtitle}>Thank you for your order.</p>

                {txnId && (
                    <div style={styles.details}>
                        <p>Transaction ID:</p>
                        <code style={styles.code}>{txnId}</code>
                    </div>
                )}

                <Link to="/" style={styles.button}>Back to Home Shop</Link>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
        background: "#0a0a0a",
        color: "#fff",
        fontFamily: "'Poppins', sans-serif"
    },
    card: {
        background: "#121212",
        padding: "50px",
        borderRadius: "24px",
        textAlign: "center",
        width: "100%",
        maxWidth: "450px",
        border: "1px solid #d4af37"
    },
    icon: {
        fontSize: "60px",
        marginBottom: "20px"
    },
    title: {
        color: "#d4af37",
        fontSize: "28px",
        marginBottom: "10px"
    },
    subtitle: {
        color: "#888",
        marginBottom: "30px"
    },
    details: {
        background: "#1a1a1a",
        padding: "15px",
        borderRadius: "10px",
        marginBottom: "30px"
    },
    code: {
        color: "#00b9f1",
        fontSize: "14px"
    },
    button: {
        display: "inline-block",
        padding: "12px 30px",
        background: "#d4af37",
        color: "#000",
        borderRadius: "30px",
        textDecoration: "none",
        fontWeight: "bold"
    }
};

export default Success;
