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

// CORS — locked down to configured origin in production
const allowedOrigins = [
    "http://localhost:5173", 
    "http://localhost:4173", 
    "http://127.0.0.1:5173", 
    "http://127.0.0.1:4173",
    "https://deza-ecommerce.vercel.app" // Add the default Vercel URL
];

if (process.env.ALLOWED_ORIGIN) {
    process.env.ALLOWED_ORIGIN.split(",").forEach(o => allowedOrigins.push(o.trim()));
}

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (eg. mobile apps, Postman)
            if (!origin) return callback(null, true);
            
            // Exact match or ends with .vercel.app for development ease
            const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");
            
            if (isAllowed) {
                return callback(null, true);
            } else {
                console.warn(`⚠️ Blocked by CORS: ${origin}`);
                return callback(new Error(`CORS policy: origin ${origin} not allowed`));
            }
        },
        credentials: true,
    })
);

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
        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    })
    .catch((err) => {
        console.error("❌ MongoDB connection failed:", err.message);
        process.exit(1);
    });
