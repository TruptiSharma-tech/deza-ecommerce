import express from "express";
import Order from "../models/Order.js";
import { sendEmail, getBrandedTemplate } from "../utils/emailHelper.js";

const router = express.Router();

// ─── GET All Orders (Admin) ────────────────────────────────────────────────────
router.get("/", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch orders." });
    }
});

// ─── GET Orders by Customer Email ─────────────────────────────────────────────
router.get("/my/:email", async (req, res) => {
    try {
        const orders = await Order.find({ customerEmail: req.params.email }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch your orders." });
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

        const orderId = `DZ-${Math.floor(1000000 + Math.random() * 9000000)}`;

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
            date: new Date().toISOString(),
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
router.patch("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const oldOrder = await Order.findById(req.params.id);

        const updated = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
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
            `);
            sendEmail(updated.customerEmail, `📦 DEZA Order Update: ${status}`, html);
        }

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

// ─── PATCH - Return Request ────────────────────────────────────────────────────
router.patch("/:id/return", async (req, res) => {
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
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: "Failed to submit return request." });
    }
});

// ─── PATCH - Refund Request ────────────────────────────────────────────────────
router.patch("/:id/refund", async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found." });

        order.refundStatus = "Refund Requested";
        order.refundRequestDate = new Date().toLocaleString();
        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: "Failed to submit refund request." });
    }
});

// ─── DELETE - Delete Order (Admin) ────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Order.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Order not found." });
        res.json({ message: "Order deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete order." });
    }
});

export default router;
