import express from "express";
import SupportTicket from "../models/SupportTicket.js";
import Order from "../models/Order.js";
import AuditLog from "../models/AuditLog.js";
import { auth, adminOnly } from "../middleware/auth.js";
import { sendEmail, getBrandedTemplate } from "../utils/emailHelper.js";
import { processAutomatedRefund } from "../utils/refundService.js";
import razorpay from "../utils/razorpay.js";

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

        // ✅ Send confirmation email to the user
        try {
            const emailBody = `
                <div style="font-family: 'Times New Roman', serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: #d4af37; text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">DEZA Luxury Concierge</h2>
                    
                    <p>Dear ${name.trim()},</p>
                    
                    <p>Thank you for reaching out to DEZA Luxury Support. We have formally received your communication regarding your recent inquiry.</p>
                    
                    <div style="background: #fdfdfd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f0f0f0;">
                        <p style="margin: 5px 0;"><strong>Case Reference:</strong> DZ-TK-${String(newTicket._id).slice(-6).toUpperCase()}</p>
                        <p style="margin: 5px 0;"><strong>Status:</strong> Under Review</p>
                    </div>

                    <p>Our dedicated support specialists are currently reviewing the details you provided:</p>
                    
                    <div style="border-left: 4px solid #d4af37; padding: 15px; background: #fafafa; margin: 15px 0; font-style: italic;">
                        "${message.trim()}"
                    </div>

                    <p>Please rest assured that your satisfaction is our highest priority. One of our concierge representatives will provide a personalized response within the next 24 to 48 business hours.</p>
                    
                    <p style="margin-top: 30px;">Sincerely,</p>
                    <p><strong>The DEZA Concierge Team</strong><br/>
                    <span style="font-size: 12px; color: #888;">Luxury Fragrances & Boutique Experience</span></p>
                </div>
            `;
            const template = getBrandedTemplate("We've Received Your Inquiry", emailBody);
            await sendEmail(email.toLowerCase().trim(), `[DEZA Support] Inquiry Received - Case #DZ-TK-${String(newTicket._id).slice(-6).toUpperCase()}`, template);
        } catch (emailErr) {
            console.error("Failed to send support confirmation email:", emailErr);
        }

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

        if (ticket.orderId) {
            try {
                const order = await Order.findOne({ 
                    $or: [
                        { orderNumber: { $regex: new RegExp(`^${ticket.orderId?.trim()}$`, 'i') } }, 
                        { _id: ticket.orderId?.match(/^[0-9a-fA-F]{24}$/) ? ticket.orderId : null }
                    ] 
                });

                if (!order) {
                    return res.status(404).json({ 
                        error: `Order "${ticket.orderId}" not found.` 
                    });
                }

                const result = await processAutomatedRefund(order._id, `Refund for Ticket DZ-TK-${String(ticket._id).slice(-6).toUpperCase()}`);
                
                if (!result.success) {
                    return res.status(400).json({ error: result.error });
                }

                ticket.refundStatus = "Completed";
                ticket.razorpayRefundId = result.refundId || "PROCESSED";
            } catch (err) {
                console.error("Refund processing error:", err);
                return res.status(500).json({ error: "Failed to process refund." });
            }
        }

        ticket.status = "Resolved";
        ticket.resolved = true;
        await ticket.save();

        await logAdminAction(req.user.id, "Initiate Refund", "Finance", `Refund for ticket ${ticket._id} initiated.`, req.ip);
        res.json({ message: "Refund processed and customer notified.", ticket });
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
