import express from "express";
import Category from "../models/Category.js";
import AuditLog from "../models/AuditLog.js";
import HeroSettings from "../models/HeroSettings.js";
import Brand from "../models/Brand.js";
import Subscriber from "../models/Subscriber.js";
import Coupon from "../models/Coupon.js";
import { auth, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// Helper for logging
const logAdminAction = async (adminId, action, module, details, ip) => {
    try {
        await AuditLog.create({ adminId, action, module, details, ipAddress: ip || "0.0.0.0" });
    } catch (err) {
        console.error(`FAILED TO LOG ${action}:`, err);
    }
};

// ─── Categories ───────────────────────────────────────────────────────────────
router.get("/categories", async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch categories." });
    }
});

router.post("/categories", auth, adminOnly, async (req, res) => {
    try {
        const newCategory = await Category.create(req.body);

        await logAdminAction(req.user.id, "Add Category", "Settings", `Added: ${newCategory.name}`, req.ip);
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(500).json({ error: "Failed to create category." });
    }
});

// ─── Hero Settings (Home Page) ────────────────────────────────────────────────
router.get("/hero-settings", async (req, res) => {
    try {
        let settings = await HeroSettings.findOne();
        if (!settings) {
            settings = await HeroSettings.create({
                banners: [],
                headline: "Luxury Perfumes for Every Mood",
                subheadline: "Discover the signature fragrance collection by DEZA.",
                ctaText: "Find Your Scent ✨",
                ctaLink: "/shop",
            });
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch hero settings." });
    }
});

router.put("/hero-settings", auth, adminOnly, async (req, res) => {
    try {
        const { banners, headline, subheadline, ctaText, ctaLink } = req.body;

        let settings = await HeroSettings.findOne();
        if (!settings) {
            settings = await HeroSettings.create({ banners, headline, subheadline, ctaText, ctaLink });
        } else {
            if (banners !== undefined) settings.banners = banners;
            if (headline !== undefined) settings.headline = headline;
            if (subheadline !== undefined) settings.subheadline = subheadline;
            if (ctaText !== undefined) settings.ctaText = ctaText;
            if (ctaLink !== undefined) settings.ctaLink = ctaLink;
            await settings.save();
        }

        await logAdminAction(req.user.id, "Update Hero", "Settings", `Updated hero section`, req.ip);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: "Failed to update hero settings." });
    }
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get("/audit-logs", auth, adminOnly, async (req, res) => {
    try {
        const logs = await AuditLog.find().populate("adminId", "name email").sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch audit logs." });
    }
});

// ─── Brands ──────────────────────────────────────────────────────────────────
router.get("/brands", async (req, res) => {
    try {
        const brands = await Brand.find().sort({ name: 1 });
        res.json(brands);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch brands." });
    }
});

router.post("/brands", auth, adminOnly, async (req, res) => {
    try {
        const newBrand = await Brand.create(req.body);
        await logAdminAction(req.user.id, "Add Brand", "Settings", `Added brand: ${newBrand.name}`, req.ip);
        res.status(201).json(newBrand);
    } catch (err) {
        res.status(500).json({ error: "Failed to create brand." });
    }
});

// ─── Subscribers ──────────────────────────────────────────────────────────────
router.get("/subscribers", auth, adminOnly, async (req, res) => {
    try {
        const subscribers = await Subscriber.find().sort({ createdAt: -1 });
        res.json(subscribers);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch subscribers." });
    }
});

router.post("/subscribe", async (req, res) => {
    try {
        const { email } = req.body;
        const sub = await Subscriber.findOneAndUpdate(
            { email: email.toLowerCase() },
            { status: "Active" },
            { upsert: true, new: true }
        );
        res.status(201).json(sub);
    } catch (err) {
        res.status(500).json({ error: "Failed to subscribe." });
    }
});

// ─── Coupons ──────────────────────────────────────────────────────────────────
router.get("/coupons", auth, adminOnly, async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch coupons." });
    }
});

router.post("/coupons", auth, adminOnly, async (req, res) => {
    try {
        const newCoupon = await Coupon.create(req.body);
        await logAdminAction(req.user.id, "Add Coupon", "Settings", `Added coupon: ${newCoupon.code}`, req.ip);
        res.status(201).json(newCoupon);
    } catch (err) {
        res.status(500).json({ error: "Failed to create coupon." });
    }
});

export default router;

