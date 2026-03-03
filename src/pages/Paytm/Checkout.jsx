import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // ✅ Get Real Cart Data
    const checkoutInfo = JSON.parse(localStorage.getItem("checkoutInfo")) || {};
    const cart = checkoutInfo.cart || [];
    const rawTotal = checkoutInfo.total || 0;

    // Clean amount (remove ₹, commas etc)
    const total = typeof rawTotal === "string"
        ? Number(rawTotal.replace(/[^0-9.]/g, ""))
        : Number(rawTotal);

    // Redirect if cart is empty
    React.useEffect(() => {
        if (!cart.length) navigate("/checkout");
    }, [cart, navigate]);

    const handlePayment = async () => {
        if (!total || total <= 0) return alert("Invalid amount");

        setLoading(true);
        try {
            const orderData = {
                amount: total,
                email: checkoutInfo.email || "customer@deza.com",
                phone: checkoutInfo.phone || "9999999999"
            };

            // 1. Call your backend to create a Paytm Order
            const response = await axios.post("http://localhost:5000/api/payment/create-order", orderData);

            const { mid, orderId, signature, paytmParams } = response.data;

            // 2. Prepare the Paytm form data for redirection
            // Since Paytm requires a POST redirection, we programmatically create and submit a form
            const paytmUrl = `https://securegw-stage.paytm.in/theia/api/v1/showPaymentPage?mid=${mid}&orderId=${orderId}`;

            // Create a hidden form to submit to Paytm
            const form = document.createElement("form");
            form.method = "post";
            form.action = paytmUrl;

            // Add the required parameters as hidden inputs
            const params = {
                mid: mid,
                orderId: orderId,
                txnToken: signature, // In the latest API, this is often the txnToken
            };

            // Note: For the basic redirection flow, we usually just need the txnToken
            // If using the older 'Checksum' flow, parameters vary.
            // For the modern Redirect flow:

            const txnTokenResponse = await axios.post(`https://securegw-stage.paytm.in/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`, {
                body: paytmParams,
                head: { signature: signature }
            });

            const token = txnTokenResponse.data.body.txnToken;

            const input = document.createElement("input");
            input.type = "hidden";
            input.name = "txnToken";
            input.value = token;
            form.appendChild(input);

            const midInput = document.createElement("input");
            midInput.type = "hidden";
            midInput.name = "mid";
            midInput.value = mid;
            form.appendChild(midInput);

            const orderIdInput = document.createElement("input");
            orderIdInput.type = "hidden";
            orderIdInput.name = "orderId";
            orderIdInput.value = orderId;
            form.appendChild(orderIdInput);

            document.body.appendChild(form);
            form.submit();

        } catch (error) {
            console.error("Payment Error:", error);
            alert("Payment failed to initiate. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Secure Checkout</h1>
                <p style={styles.subtitle}>Complete your purchase with Paytm</p>

                <div style={styles.summary}>
                    <div style={styles.row}>
                        <span>Total Amount:</span>
                        <span style={styles.amount}>₹{total}</span>
                    </div>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={loading}
                    style={styles.button}
                >
                    {loading ? "Processing..." : "Pay with Paytm 💳"}
                </button>

                <p style={styles.footer}>UPI • Cards • Net Banking</p>
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
        padding: "40px",
        borderRadius: "20px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        textAlign: "center",
        width: "100%",
        maxWidth: "400px",
        border: "1px solid #333"
    },
    title: {
        color: "#d4af37",
        fontSize: "28px",
        marginBottom: "10px"
    },
    subtitle: {
        color: "#888",
        fontSize: "14px",
        marginBottom: "30px"
    },
    summary: {
        background: "#1a1a1a",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "30px"
    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "18px"
    },
    amount: {
        color: "#d4af37",
        fontWeight: "bold"
    },
    button: {
        width: "100%",
        padding: "15px",
        borderRadius: "10px",
        border: "none",
        background: "#00b9f1", // Paytm Blue
        color: "#fff",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
        transition: "0.3s"
    },
    footer: {
        marginTop: "20px",
        fontSize: "12px",
        color: "#555"
    }
};

export default Checkout;
