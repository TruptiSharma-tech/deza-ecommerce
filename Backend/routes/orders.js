import express from "express";
import { nanoid } from "nanoid";
import Order from "../models/Order.js";
import AuditLog from "../models/AuditLog.js";
import { auth, adminOnly } from "../middleware/auth.js";
import { sendEmail, getBrandedTemplate } from "../utils/emailHelper.js";

const router = express.Router();

// ─── GET All Orders (Admin only) ──────────────────────────────────────────────
router.get("/", auth, adminOnly, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch orders." });
    }
});

// ─── GET Orders by Customer Email (Enforce Privacy) ──────────────────────────
router.get("/my/:email", auth, async (req, res) => {
    try {
        // Security check: Only allow users to see their own orders unless they are admin
        if (req.user.email.toLowerCase() !== req.params.email.toLowerCase() && req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied. You can only view your own orders." });
        }

        const orders = await Order.find({ customerEmail: req.params.email }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch your orders." });
    }
});

// ─── GET Single Order by orderId string (for TrackOrder page) ─────────────────
router.get("/track/:orderId", auth, async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) return res.status(404).json({ error: "Order not found." });

        // Only allow users to track their own orders (admins can track all)
        if (req.user.role !== "admin" && order.customerEmail.toLowerCase() !== req.user.email.toLowerCase()) {
            return res.status(403).json({ error: "Access denied." });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch order." });
    }
});


// ─── POST - Create Order ───────────────────────────────────────────────────────
router.post("/", async (req, res) => {
    try {
        const {
            customerId,
            customerName,
            customerPhone,
            customerEmail,
            address,
            items,
            totalPrice,
            paymentMethod,
            paymentId,
            paymentStatus,
            status,
            category,
            type,
        } = req.body;

        // ✅ nanoid generates collision-proof unique IDs
        const orderId = `DZ-${nanoid(10).toUpperCase()}`;

        const newOrder = await Order.create({
            orderId,
            customerId: customerId || null,
            customerName: customerName || "",
            customerPhone: customerPhone || "",
            customerEmail: customerEmail || "",
            address: address || {},
            items: items || [],
            totalPrice: Number(totalPrice) || 0,
            paymentMethod: paymentMethod || "Cash On Delivery",
            paymentId: paymentId || "",
            paymentStatus: paymentStatus || "Pending",
            status: status || "Pending",
            category: category || "",
            type: type || "",
        });

        // Send Order Confirmation Email
        if (customerEmail) {
            const itemsList = items.map(i => `<li>${i.name} (Qty: ${i.qty}) - ₹${i.price}</li>`).join("");
            const html = getBrandedTemplate("Order Placed Successfully ✨", `
                <p>Hello ${customerName},</p>
                <p>Thank you for shopping with DEZA! Your elegant choices have been received.</p>
                <div style="background: #fdfaf0; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0;">
                    <strong>Order ID:</strong> ${orderId}<br/>
                    <strong>Total Amount:</strong> ₹${totalPrice}<br/>
                    <strong>Payment Method:</strong> ${paymentMethod}
                </div>
                <h3>Order Summary:</h3>
                <ul>${itemsList}</ul>
                <p>We will notify you when your order is shipped!</p>
            `);
            sendEmail(customerEmail, `✨ DEZA Order Confirmation - ${orderId}`, html);
        }

        res.status(201).json(newOrder);
    } catch (err) {
        console.error("Create order error:", err);
        res.status(500).json({ error: "Failed to create order." });
    }
});

// ─── PATCH - Update Order Status (Admin) ──────────────────────────────────────
router.patch("/:id/status", auth, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;
        const oldOrder = await Order.findById(req.params.id);

        const updateData = { status };
        if (status === "Delivered") {
            updateData.deliveredAt = new Date();
        }

        const updated = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: "Order not found." });

        if (status !== oldOrder.status && updated.customerEmail) {
            const html = getBrandedTemplate("Order Status Updated 📦", `
                <p>Hello ${updated.customerName},</p>
                <p>Your DEZA Order <strong>${updated.orderId || updated._id}</strong> has a new update.</p>
                <div style="background: #1a1a1a; color: #d4af37; padding: 15px; text-align: center; border-radius: 8px; font-weight: bold; font-size: 20px; margin: 20px 0;">
                    Current Status: ${status.toUpperCase()}
                </div>
                <p>Thank you for choosing DEZA. We hope you enjoy the luxury experience.</p>
                <p style="font-size: 12px; opacity: 0.7;">Note: Exchange/Return requests are accepted within 48 hours of delivery.</p>
            `);
            sendEmail(updated.customerEmail, `📦 DEZA Order Update: ${status}`, html);
        }

        // ✅ RECORD AUDIT LOG
        await AuditLog.create({
            adminId: req.user.id,
            action: "Update Order",
            module: "Orders",
            details: `Updated order ${updated.orderId} status to ${status}`,
            ipAddress: req.ip || "0.0.0.0"
        });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to update order status." });
    }
});

// ─── PATCH - Cancel Order (User) ──────────────────────────────────────────────
router.patch("/:id/cancel", async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found." });
        if (order.status === "Delivered") {
            return res.status(400).json({ error: "Delivered orders cannot be cancelled." });
        }
        order.status = "Cancelled";
        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: "Failed to cancel order." });
    }
});

// ─── PATCH - Return Request (Linked to Support Query) ──────────────────────────
router.patch("/:id/return", auth, async (req, res) => {
    try {
        const { returnType, reason, message } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found." });

        order.returnStatus = "Return Requested";
        order.returnRequest = {
            type: returnType,
            reason,
            message,
            date: new Date().toLocaleString(),
        };
        await order.save();

        // ✅ AUTO-CREATE SUPPORT TICKET FOR ADMIN
        const SupportTicket = (await import("../models/SupportTicket.js")).default;
        await SupportTicket.create({
            name: order.customerName,
            email: order.customerEmail,
            message: `Order #${order.orderId}: ${returnType} requested. Reason: ${reason}. Message: ${message}`,
            ticketType: returnType === "Exchange" ? "Exchange Request" : "Return Request",
            issueType: reason === "Wrong Product Received" ? "Wrong Product Received" : (reason === "Damaged Product" ? "Damaged Product" : "Other"),
            orderId: order.orderId,
            priority: "High",
            status: "Pending",
        });

        res.json(order);
    } catch (err) {
        console.error("Return request error:", err);
        res.status(500).json({ error: "Failed to submit return request." });
    }
});

// ─── PATCH - Refund Request (Linked to Support Query) ──────────────────────────
router.patch("/:id/refund", auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found." });

        order.refundStatus = "Refund Requested";
        order.refundRequestDate = new Date().toLocaleString();
        await order.save();

        // ✅ AUTO-CREATE SUPPORT TICKET FOR ADMIN
        const SupportTicket = (await import("../models/SupportTicket.js")).default;
        await SupportTicket.create({
            name: order.customerName,
            email: order.customerEmail,
            message: `Refund requested for Order #${order.orderId}. Status: Delivered.`,
            ticketType: "Refund Request",
            issueType: "Other",
            orderId: order.orderId,
            priority: "High",
            status: "Pending",
        });

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: "Failed to submit refund request." });
    }
});

// ─── DELETE - Delete Order (Admin) ────────────────────────────────────────────
router.delete("/:id", auth, adminOnly, async (req, res) => {
    try {
        const deleted = await Order.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Order not found." });

        // ✅ RECORD AUDIT LOG
        await AuditLog.create({
            adminId: req.user.id,
            action: "Delete Order",
            module: "Orders",
            details: `Deleted order ${deleted.orderId}`,
            ipAddress: req.ip || "0.0.0.0"
        });

        res.json({ message: "Order deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete order." });
    }
});

export default router;
