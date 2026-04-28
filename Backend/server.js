import express from "express";
// DEPLOYMENT REFRESH: 2026-04-28
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
// Global limiter — increased heavily for local dev due to aggressive admin polling
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
});

// Strict limiter for auth routes — 100 attempts per 15 minutes
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

// CORS — More permissive for stability across multiple devices/URLs
app.use(cors({ origin: true, credentials: true }));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);  // ✅ strict rate limit on all auth
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

// Health check
app.get("/", (req, res) => res.json({ message: "DEZA API is running 🚀" }));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.message);
    if (err.message.startsWith("CORS policy")) {
        return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: "Internal server error." });
});

// ─── MongoDB Connection ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI not set in .env file!");
    process.exit(1);
}

mongoose
    .connect(MONGO_URI, {
        serverSelectionTimeoutMS: 30000,
        maxPoolSize: 50,
    })
    .then(() => {
        console.log("✅ MongoDB Atlas Connected Successfully!");
        
        // ─── Automated Order Status Updates (Simulation) ─────────────────────────
        // This function automatically moves orders forward if the admin forgets.
        const autoUpdateOrders = async () => {
            try {
                const Order = mongoose.model("Order");
                const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

                // 1. Auto-Deliver orders shipped > 3 days ago
                const toDeliver = await Order.updateMany(
                    { status: "Shipped", createdAt: { $lt: threeDaysAgo } },
                    { $set: { status: "Delivered" } }
                );
                if (toDeliver.modifiedCount > 0) console.log(`🤖 Auto-delivered ${toDeliver.modifiedCount} old orders.`);

                // 2. Auto-Ship orders processing > 1 day ago
                const toShip = await Order.updateMany(
                    { status: "Processing", createdAt: { $lt: oneDayAgo } },
                    { $set: { status: "Shipped", trackingNumber: "AUTO-GEN-SHIPPING" } }
                );
                if (toShip.modifiedCount > 0) console.log(`🤖 Auto-shipped ${toShip.modifiedCount} orders.`);

            } catch (err) {
                console.error("❌ Auto-update failed:", err.message);
            }
        };

        // Run once on startup and then every 6 hours
        autoUpdateOrders();
        setInterval(autoUpdateOrders, 6 * 60 * 60 * 1000);

        // ─── Health & Test Routes ──────────────────────────────────────────────────
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

        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    })
    .catch((err) => {
        console.error("❌ MongoDB connection failed:", err.message);
        process.exit(1);
    });
