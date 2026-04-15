import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_SdJA8ZBmvE42IN",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "c7vWYCsia23VKeyiXnWKkzn4",
});

// ─── POST - Create Razorpay Order ─────────────────────────────────────────────
// No auth required — user identity is tracked on the order itself (POST /orders)
router.post("/create-order", async (req, res) => {
    try {
        const { amount, currency = "INR" } = req.body;

        if (!amount) {
            return res.status(400).json({ error: "Amount is required" });
        }

        const options = {
            amount: Math.round(amount * 100), // convert to paise
            currency,
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        console.error("❌ Razorpay Order Creation Error:", err);
        const errorMessage = err.description || err.message || "Failed to create Razorpay order";
        res.status(500).json({ error: errorMessage });
    }
});

// ─── POST - Verify Payment Signature ─────────────────────────────────────────
// No auth required — signature verification is cryptographic, not session-based
router.post("/verify-payment", async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: "Missing payment details for verification." });
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "c7vWYCsia23VKeyiXnWKkzn4")
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            return res.json({ message: "Payment verified successfully" });
        } else {
            return res.status(400).json({ error: "Invalid signature. Payment may be tampered." });
        }
    } catch (err) {
        console.error("Signature Verification Error:", err);
        res.status(500).json({ error: "Internal Server Error during verification" });
    }
});

export default router;
