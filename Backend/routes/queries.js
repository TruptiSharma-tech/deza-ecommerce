import express from "express";
import Query from "../models/Query.js";
import { sendEmail, getBrandedTemplate } from "../utils/emailHelper.js";

const router = express.Router();

// ─── GET All Queries (Admin) ───────────────────────────────────────────────────
router.get("/", async (req, res) => {
    try {
        const queries = await Query.find().sort({ createdAt: -1 });
        res.json(queries);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch queries." });
    }
});

// ─── GET Queries by User Email ─────────────────────────────────────────────────
router.get("/my/:email", async (req, res) => {
    try {
        const searchEmail = req.params.email.toLowerCase().trim();
        const queries = await Query.find({ email: searchEmail }).sort({ createdAt: -1 });
        res.json(queries);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch your queries." });
    }
});

// ─── POST - Submit Query ───────────────────────────────────────────────────────
router.post("/", async (req, res) => {
    try {
        const { name, email, message, image } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "Name, email, and message are required." });
        }

        const newQuery = await Query.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            message: message.trim(),
            image: image || "",
            status: "Pending",
            date: new Date().toLocaleString(),
        });

        // Send Confirmation Email
        const html = getBrandedTemplate("Ticket Received 🎫", `
            <p>Hello ${name},</p>
            <p>We have successfully received your support request regarding:</p>
            <blockquote style="background: #f0f0f0; padding: 15px; border-radius: 5px;">"${message}"</blockquote>
            <p>Our team is reviewing your ticket (ID: DZ-${String(newQuery._id).slice(-6).toUpperCase()}) and will get back to you shortly.</p>
        `);
        await sendEmail(email, "🎫 DEZA Support Ticket Received", html);

        res.status(201).json(newQuery);
    } catch (err) {
        res.status(500).json({ error: "Failed to submit query." });
    }
});

// ─── PATCH - Update Priority / Status (Admin) ─────────────────────────────────
router.patch("/:id", async (req, res) => {
    try {
        const queryBefore = await Query.findById(req.params.id);
        const updated = await Query.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Query not found." });

        // If status changed, notify user
        if (req.body.status && req.body.status !== queryBefore.status) {
            const html = getBrandedTemplate(`Status Update: ${req.body.status} 📊`, `
                <p>Hello ${updated.name},</p>
                <p>The status of your DEZA support ticket <strong>DZ-${String(updated._id).slice(-6).toUpperCase()}</strong> has been updated to:</p>
                <div style="background: #1a1a1a; color: #d4af37; padding: 15px; text-align: center; border-radius: 8px; font-weight: bold; font-size: 20px;">
                    ${req.body.status.toUpperCase()}
                </div>
                <p style="margin-top: 20px;">You can track your ticket live on our <a href="http://localhost:5173/my-tickets" style="color: #d4af37;">Support Center</a>.</p>
            `);
            await sendEmail(updated.email, `📊 Ticket Status Updated: ${req.body.status}`, html);
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to update query." });
    }
});

// ─── PATCH - Admin Reply ───────────────────────────────────────────────────────
router.patch("/:id/reply", async (req, res) => {
    try {
        const { adminReply } = req.body;
        if (!adminReply) return res.status(400).json({ error: "Reply text is required." });

        const updated = await Query.findByIdAndUpdate(
            req.params.id,
            {
                adminReply,
                repliedAt: new Date().toLocaleString(),
                status: "Resolved",
                resolved: true,
            },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: "Query not found." });

        // Send Reply Email
        const html = getBrandedTemplate("Support Ticket Resolved ✅", `
            <p>Hello ${updated.name},</p>
            <p>Our team has responded to your ticket:</p>
            <div style="background: #fdfaf0; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0;">
                <strong>Admin Reply:</strong>
                <p>${adminReply}</p>
            </div>
            <p>Your ticket status is now: <strong>Resolved</strong>.</p>
        `);
        await sendEmail(updated.email, "✅ DEZA Support Reply", html);

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to send reply." });
    }
});

// ─── POST - Initiate Refund ──────────────────────────────────────────────────────
router.post("/:id/refund", async (req, res) => {
    try {
        const query = await Query.findById(req.params.id);
        if (!query) return res.status(404).json({ error: "Query not found." });

        if (query.refundStatus === "Initiated" || query.refundStatus === "Completed") {
            return res.status(400).json({ error: "Refund already processed." });
        }

        query.refundStatus = "Initiated";
        await query.save();

        const html = getBrandedTemplate("Refund Initiated 💸", `
            <p>Hello ${query.name},</p>
            <p>This email is to confirm that a refund has been initiated from our end for your support ticket <strong>DZ-${String(query._id).slice(-6).toUpperCase()}</strong>.</p>
            <p><strong>Timeline:</strong> The amount will be reflected in your original payment method within the next 24-48 business hours after the order pickup is completed.</p>
            <p>Thank you for choosing DEZA Luxury.</p>
        `);
        await sendEmail(query.email, "💸 DEZA Refund Initiated", html);

        res.json({ message: "Refund successfully initiated.", query });
    } catch (err) {
        res.status(500).json({ error: "Failed to initiate refund." });
    }
});

// ─── DELETE Query ──────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Query.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Query not found." });
        res.json({ message: "Query deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete query." });
    }
});

export default router;
