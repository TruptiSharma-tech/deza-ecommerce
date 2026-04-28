import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import queryRoutes from "./routes/queries.js";
import reviewRoutes from "./routes/reviews.js";
import adminRoutes from "./routes/admin.js";
import paymentRoutes from "./routes/payments.js";
import compression from "compression";

dotenv.config();

const app = express();

// ─── Rate Limiters ──────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many auth attempts, please try again in 15 minutes." },
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(compression());
app.use(globalLimiter);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

// ─── Health & Test Routes ──────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ message: "DEZA API is running 🚀" }));

app.get("/api/test-email", async (req, res) => {
    try {
        const { sendEmail, getBrandedTemplate } = await import("./utils/emailHelper.js");
        const template = getBrandedTemplate("System Connection Test", "<p>If you are reading this, your DEZA SMTP server is configured correctly and working!</p>");
        const success = await sendEmail(process.env.SMTP_USER, "🛠️ DEZA SMTP Test", template);
        
        if (success) {
            res.json({ message: "Test email sent successfully to " + process.env.SMTP_USER });
        } else {
            res.status(500).json({ error: "SMTP Failed. Check Render logs or Environment Variables." });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({ error: "Internal server error." });
});

// ─── Automated Order Status Updates ─────────────────────────────────────────
const autoUpdateOrders = async () => {
    try {
        const Order = mongoose.model("Order");
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const toShip = await Order.updateMany(
            { orderStatus: "Pending", createdAt: { $lt: yesterday } },
            { $set: { orderStatus: "Shipped", trackingNumber: "AUTO-GEN-SHIPPING" } }
        );
        if (toShip.modifiedCount > 0) console.log(`🤖 Auto-shipped ${toShip.modifiedCount} orders.`);
    } catch (err) {
        console.error("❌ Auto-update failed:", err.message);
    }
};

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");
        autoUpdateOrders();
        setInterval(autoUpdateOrders, 6 * 60 * 60 * 1000);
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
        // Start server anyway for diagnostics
        app.listen(PORT, () => console.log(`🚀 Server running in DIAGNOSTIC MODE (No DB) on port ${PORT}`));
    });
