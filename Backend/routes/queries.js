import express from "express";
import SupportTicket from "../models/SupportTicket.js";
import AuditLog from "../models/AuditLog.js";
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

// ─── GET All Tickets (Admin) ───────────────────────────────────────────────────
router.get("/", auth, adminOnly, async (req, res) => {
    try {
        const tickets = await SupportTicket.find().sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch support tickets." });
    }
});

// ─── GET Tickets by User Email (Enforce Privacy) ───────────────────────────────
router.get("/my/:email", auth, async (req, res) => {
    try {
        const searchEmail = req.params.email.toLowerCase().trim();

        // Security check
        const adminRoles = ["superadmin", "manager", "support", "admin"];
        if (req.user.email.toLowerCase() !== searchEmail && !adminRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied." });
        }

        const tickets = await SupportTicket.find({ email: searchEmail }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch your tickets." });
    }
});

// ─── POST - Submit Support Ticket ─────────────────────────────────────────────
router.post("/", async (req, res) => {
    try {
        const { name, email, message, image, ticketType, issueType, orderId } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "Name, email, and message are required." });
        }

        const newTicket = await SupportTicket.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            message: message.trim(),
            image: image || "",
            ticketType: ticketType || "General Query",
            issueType: issueType || "Other",
            orderId: orderId || "",
            status: "Pending",
        });

        res.status(201).json(newTicket);
    } catch (err) {
        res.status(500).json({ error: "Failed to submit support ticket." });
    }
});

// ─── PATCH - Update Status (Admin) ─────────────────────────────────────────────
router.patch("/:id", auth, adminOnly, async (req, res) => {
    try {
        const updated = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Ticket not found." });

        await logAdminAction(req.user.id, "Update Status", "Support", `Updated ticket ${updated._id} to ${updated.status}`, req.ip);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to update ticket." });
    }
});

// ─── PATCH - Admin Reply ───────────────────────────────────────────────────────
router.patch("/:id/reply", auth, adminOnly, async (req, res) => {
    try {
        const { adminReply } = req.body;
        if (!adminReply) return res.status(400).json({ error: "Reply text is required." });

        const updated = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            {
                adminReply,
                repliedAt: new Date(),
                status: "Resolved",
                resolved: true,
            },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: "Ticket not found." });

        await logAdminAction(req.user.id, "Support Reply", "Support", `Replied to ${updated.email}`, req.ip);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to send reply." });
    }
});

// ─── POST - Initiate Refund ──────────────────────────────────────────────────────
router.post("/:id/refund", auth, adminOnly, async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ error: "Ticket not found." });

        ticket.status = "Resolved";
        ticket.resolved = true;
        await ticket.save();

        await logAdminAction(req.user.id, "Initiate Refund", "Finance", `Refund for ticket ${ticket._id}`, req.ip);
        res.json({ message: "Refund initiated.", ticket });
    } catch (err) {
        res.status(500).json({ error: "Failed to process refund." });
    }
});

// ─── DELETE Ticket ──────────────────────────────────────────────────────────────
router.delete("/:id", auth, adminOnly, async (req, res) => {
    try {
        const deleted = await SupportTicket.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Ticket not found." });

        await logAdminAction(req.user.id, "Delete Ticket", "Support", `Deleted ticket from ${deleted.email}`, req.ip);
        res.json({ message: "Ticket deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete ticket." });
    }
});

export default router;
