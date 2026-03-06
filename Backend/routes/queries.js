import express from "express";
import SupportTicket from "../models/SupportTicket.js";
import AuditLog from "../models/AuditLog.js";
import { auth, adminOnly } from "../middleware/auth.js";
import { sendEmail, getBrandedTemplate } from "../utils/emailHelper.js";

const router = express.Router();

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

        // Security check: Match logged-in user email
        if (req.user.email.toLowerCase() !== searchEmail && req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied. You can only view your own tickets." });
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

        // Send Confirmation Email
        const html = getBrandedTemplate("Ticket Received 🎫", `
            <p>Hello ${name},</p>
            <p>We have successfully received your support request [${newTicket.ticketType}].</p>
            <blockquote style="background: #f0f0f0; padding: 15px; border-radius: 5px;">"${message}"</blockquote>
            <p>Ticket ID: <strong>DZ-TK-${String(newTicket._id).slice(-6).toUpperCase()}</strong></p>
            <p>Our team will get back to you shortly.</p>
        `);
        await sendEmail(email, `🎫 DEZA Support Ticket: ${newTicket.ticketType}`, html);

        res.status(201).json(newTicket);
    } catch (err) {
        console.error("Ticket submission error:", err);
        res.status(500).json({ error: "Failed to submit support ticket." });
    }
});

// ─── PATCH - Update Status (Admin) ─────────────────────────────────────────────
router.patch("/:id", auth, adminOnly, async (req, res) => {
    try {
        const ticketBefore = await SupportTicket.findById(req.params.id);
        const updated = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Ticket not found." });

        if (req.body.status && req.body.status !== ticketBefore.status) {
            const html = getBrandedTemplate(`Ticket Status: ${req.body.status} 📊`, `
                <p>Hello ${updated.name},</p>
                <p>The status of your support ticket <strong>DZ-TK-${String(updated._id).slice(-6).toUpperCase()}</strong> has been updated to:</p>
                <div style="background: #1a1a1a; color: #d4af37; padding: 15px; text-align: center; border-radius: 8px; font-weight: bold; font-size: 20px;">
                    ${req.body.status.toUpperCase()}
                </div>
            `);
            await sendEmail(updated.email, `📊 Ticket Status Updated: ${req.body.status}`, html);
        }

        await AuditLog.create({
            adminId: req.user.id,
            action: "Update Support Ticket",
            module: "Support",
            details: `Updated ticket ${updated._id} status to ${updated.status}`,
            ipAddress: req.ip || "0.0.0.0"
        });

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

        await AuditLog.create({
            adminId: req.user.id,
            action: "Support Reply",
            module: "Support",
            details: `Replied to ticket from ${updated.email}`,
            ipAddress: req.ip || "0.0.0.0"
        });

        const html = getBrandedTemplate("Support Ticket Resolved ✅", `
            <p>Hello ${updated.name},</p>
            <p>Our team has responded to your ticket:</p>
            <div style="background: #fdfaf0; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0;">
                <p>${adminReply}</p>
            </div>
        `);
        await sendEmail(updated.email, "✅ DEZA Support Reply", html);

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

        // ✅ RECORD AUDIT LOG
        await AuditLog.create({
            adminId: req.user.id,
            action: "Initiate Refund",
            module: "Finance",
            details: `Refund processed for ticket ${ticket._id}`,
            ipAddress: req.ip || "0.0.0.0"
        });

        // Send Refund Confirmation Email with 24h promise
        const html = getBrandedTemplate("Refund Initiated 💸", `
            <p>Hello ${ticket.name},</p>
            <p>This email is to confirm that a refund has been initiated for your support ticket <strong>DZ-TK-${String(ticket._id).slice(-6).toUpperCase()}</strong>.</p>
            <p style="font-size: 18px; color: #d4af37; font-weight: bold;">💎 DEZA Promise: 24-Hour Refund Timeline</p>
            <p>As per our premium service policy, the amount will be credited back to your original payment method within <strong>24 business hours</strong>.</p>
            <p>Thank you for your patience and for choosing DEZA Luxury.</p>
        `);
        await sendEmail(ticket.email, "💸 DEZA Refund Initiated (24-Hour Promise)", html);

        res.json({ message: "Refund initiated and email sent.", ticket });
    } catch (err) {
        console.error("Refund error:", err);
        res.status(500).json({ error: "Failed to process refund." });
    }
});

// ─── DELETE Ticket ──────────────────────────────────────────────────────────────
router.delete("/:id", auth, adminOnly, async (req, res) => {
    try {
        const deleted = await SupportTicket.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Ticket not found." });

        await AuditLog.create({
            adminId: req.user.id,
            action: "Delete Support Ticket",
            module: "Support",
            details: `Deleted ticket from ${deleted.email}`,
            ipAddress: req.ip || "0.0.0.0"
        });

        res.json({ message: "Ticket deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete ticket." });
    }
});

export default router;
