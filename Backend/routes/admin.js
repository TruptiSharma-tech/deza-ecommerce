import express from "express";
import Category from "../models/Category.js";
import AuditLog from "../models/AuditLog.js";
import { auth, adminOnly } from "../middleware/auth.js";

const router = express.Router();

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

        // ✅ RECORD AUDIT LOG
        await AuditLog.create({
            adminId: req.user.id,
            action: "Add Category",
            module: "Settings",
            details: `Added new category: ${newCategory.name}`,
            ipAddress: req.ip || "0.0.0.0"
        });

        res.status(201).json(newCategory);
    } catch (err) {
        res.status(500).json({ error: "Failed to create category." });
    }
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get("/audit-logs", async (req, res) => {
    try {
        const logs = await AuditLog.find().populate("adminId", "name email").sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch audit logs." });
    }
});

export default router;
