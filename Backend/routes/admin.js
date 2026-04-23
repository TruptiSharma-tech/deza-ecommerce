import express from "express";
import Category from "../models/Category.js";
import AuditLog from "../models/AuditLog.js";
import HeroSettings from "../models/HeroSettings.js";
import Brand from "../models/Brand.js";
import Subscriber from "../models/Subscriber.js";
import Coupon from "../models/Coupon.js";
import { auth, adminOnly } from "../middleware/auth.js";
import { sendEmail, getBrandedTemplate } from "../utils/emailHelper.js";

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

router.delete("/categories/:id", auth, adminOnly, async (req, res) => {
    try {
        const cat = await Category.findByIdAndDelete(req.params.id);
        if (!cat) return res.status(404).json({ error: "Category not found." });
        await logAdminAction(req.user.id, "Delete Category", "Settings", `Deleted: ${cat.name}`, req.ip);
        res.json({ message: "Category deleted permanently." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete category." });
    }
});

router.patch("/categories/:id/archive", auth, adminOnly, async (req, res) => {
    try {
        const cat = await Category.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
        if (!cat) return res.status(404).json({ error: "Category not found." });
        await logAdminAction(req.user.id, "Archive Category", "Settings", `Archived: ${cat.name}`, req.ip);
        res.json(cat);
    } catch (err) {
        res.status(500).json({ error: "Failed to archive category." });
    }
});

router.patch("/categories/:id/unarchive", auth, adminOnly, async (req, res) => {
    try {
        const cat = await Category.findByIdAndUpdate(req.params.id, { active: true }, { new: true });
        if (!cat) return res.status(404).json({ error: "Category not found." });
        await logAdminAction(req.user.id, "Restore Category", "Settings", `Restored: ${cat.name}`, req.ip);
        res.json(cat);
    } catch (err) {
        res.status(500).json({ error: "Failed to restore category." });
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
        const { banners, headline, subheadline, ctaText, ctaLink, bannerHeight, objectFit } = req.body;

        let settings = await HeroSettings.findOne();
        if (!settings) {
            settings = await HeroSettings.create({ banners, headline, subheadline, ctaText, ctaLink, bannerHeight, objectFit });
        } else {
            if (banners !== undefined) settings.banners = banners;
            if (headline !== undefined) settings.headline = headline;
            if (subheadline !== undefined) settings.subheadline = subheadline;
            if (ctaText !== undefined) settings.ctaText = ctaText;
            if (ctaLink !== undefined) settings.ctaLink = ctaLink;
            if (bannerHeight !== undefined) settings.bannerHeight = bannerHeight;
            if (objectFit !== undefined) settings.objectFit = objectFit;
            await settings.save();
        }

        await logAdminAction(req.user.id, "Update Hero", "Settings", `Updated hero section`, req.ip);
        console.log("✅ Hero settings updated successfully");
        res.json(settings);
    } catch (err) {
        console.error("❌ Hero settings update error:", err.message);
        res.status(500).json({ error: "Failed to update hero settings.", details: err.message });
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

router.delete("/brands/:id", auth, adminOnly, async (req, res) => {
    try {
        const brand = await Brand.findByIdAndDelete(req.params.id);
        if (!brand) return res.status(404).json({ error: "Brand not found." });
        await logAdminAction(req.user.id, "Delete Brand", "Settings", `Deleted brand: ${brand.name}`, req.ip);
        res.json({ message: "Brand deleted permanently." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete brand." });
    }
});

router.patch("/brands/:id/archive", auth, adminOnly, async (req, res) => {
    try {
        const brand = await Brand.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!brand) return res.status(404).json({ error: "Brand not found." });
        await logAdminAction(req.user.id, "Archive Brand", "Settings", `Archived brand: ${brand.name}`, req.ip);
        res.json(brand);
    } catch (err) {
        res.status(500).json({ error: "Failed to archive brand." });
    }
});

router.patch("/brands/:id/unarchive", auth, adminOnly, async (req, res) => {
    try {
        const brand = await Brand.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
        if (!brand) return res.status(404).json({ error: "Brand not found." });
        await logAdminAction(req.user.id, "Restore Brand", "Settings", `Restored brand: ${brand.name}`, req.ip);
        res.json(brand);
    } catch (err) {
        res.status(500).json({ error: "Failed to restore brand." });
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

// ─── Newsletter Broadcast ────────────────────────────────────────────────────
router.post("/newsletter", auth, adminOnly, async (req, res) => {
    try {
        const { subject, title, body } = req.body;
        if (!subject || !title || !body) {
            return res.status(400).json({ error: "Subject, Title, and Body are all required." });
        }

        const subscribers = await Subscriber.find({ status: "Active" });
        if (!subscribers.length) {
            return res.status(400).json({ error: "No active subscribers found." });
        }

        const emails = subscribers.map(s => s.email);
        const html = getBrandedTemplate(title, body);

        // Broadcast to all emails
        await Promise.all(emails.map(email => sendEmail(email, subject, html)));

        await logAdminAction(req.user.id, "Send Newsletter", "Newsletter", `Sent to ${emails.length} subscribers: ${subject}`, req.ip);

        res.json({ message: `Newsletter sent to ${emails.length} subscribers! 🚀` });
    } catch (err) {
        console.error("Newsletter error:", err);
        res.status(500).json({ error: "Failed to send newsletter broadcast." });
    }
});

export default router;

