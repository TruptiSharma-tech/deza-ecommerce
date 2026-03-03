import React from "react";
import { useLocation, Link } from "react-router-dom";

const Failure = () => {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const errorMsg = query.get("msg") || "The transaction could not be completed.";

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.icon}>❌</div>
                <h1 style={styles.title}>Payment Failed</h1>
                <p style={styles.subtitle}>{errorMsg}</p>

                <div style={styles.help}>
                    <p>Reasons could be:</p>
                    <ul style={styles.list}>
                        <li>Incorrect UPI PIN or Card Details</li>
                        <li>Insufficient Funds</li>
                        <li>Transaction Cancelled by User</li>
                    </ul>
                </div>

                <Link to="/checkout" style={styles.button}>Try Again</Link>
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
        border: "1px solid #ff4d4d"
    },
    icon: {
        fontSize: "60px",
        marginBottom: "20px"
    },
    title: {
        color: "#ff4d4d",
        fontSize: "28px",
        marginBottom: "10px"
    },
    subtitle: {
        color: "#888",
        marginBottom: "30px"
    },
    help: {
        textAlign: "left",
        background: "#1a1a1a",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "30px",
        fontSize: "14px",
        color: "#aaa"
    },
    list: {
        marginTop: "10px",
        paddingLeft: "20px"
    },
    button: {
        display: "inline-block",
        padding: "12px 30px",
        background: "#ff4d4d",
        color: "#fff",
        borderRadius: "30px",
        textDecoration: "none",
        fontWeight: "bold"
    }
};

export default Failure;
