import express from "express";
import { nanoid } from "nanoid";
import Order from "../models/Order.js";
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

// ─── GET All Orders (Admin only) ──────────────────────────────────────────────
router.get("/", auth, adminOnly, async (req, res) => {
    try {
        const orders = await Order.find().populate("customerId", "name email").sort({ createdAt: -1 });
        const mapped = orders.map(o => ({
            ...o.toObject(),
            totalPrice: o.totalAmount, // legacy support
            status: o.orderStatus,      // legacy support
            orderId: o.orderNumber      // legacy support
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch orders." });
    }
});

// ─── GET My Orders ────────────────────────────────────────────────────────────
router.get("/my", auth, async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.user.id }).sort({ createdAt: -1 });
        const mapped = orders.map(o => ({
            ...o.toObject(),
            totalPrice: o.totalAmount,
            status: o.orderStatus,
            orderId: o.orderNumber
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch your orders." });
    }
});

// ─── GET Single Order (Tracking) ──────────────────────────────────────────────
router.get("/track/:orderNumber", async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber });
        if (!order) return res.status(404).json({ error: "Order not found." });
        const obj = order.toObject();
        obj.totalPrice = obj.totalAmount;
        obj.status = obj.orderStatus;
        obj.orderId = obj.orderNumber;
        res.json(obj);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch order." });
    }
});

// ─── POST - Create Order ───────────────────────────────────────────────────────
router.post("/", async (req, res) => {
    try {
        const {
            customerId,
            items,
            shippingAddress,
            totalAmount,
            paymentMethod,
            paymentDetails,
        } = req.body;

        const orderNumber = `DZ-${nanoid(10).toUpperCase()}`;

        const newOrder = await Order.create({
            orderNumber,
            customerId: customerId || null,
            items: items || [],
            shippingAddress: shippingAddress || {},
            totalAmount: Number(totalAmount) || 0,
            paymentMethod: paymentMethod || "Cash On Delivery",
            paymentDetails: paymentDetails || {},
            orderStatus: "Processing",
            statusHistory: [{ status: "Processing", comment: "Order placed successfully." }]
        });

        res.status(201).json(newOrder);
    } catch (err) {
        console.error("Create order error:", err);
        res.status(500).json({ error: "Failed to create order." });
    }
});

// ─── PATCH - Update Order Status (Admin) ──────────────────────────────────────
router.patch("/:id/status", auth, adminOnly, async (req, res) => {
    try {
        const { status, comment, trackingNumber, deliveryCompany } = req.body;

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found." });

        order.orderStatus = status;
        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (deliveryCompany) order.deliveryCompany = deliveryCompany;

        if (status === "Delivered") order.deliveredAt = new Date();
        if (status === "Cancelled") order.cancelledAt = new Date();

        order.statusHistory.push({ status, comment: comment || `Status updated to ${status}` });

        await order.save();

        await logAdminAction(req.user.id, "Update Order", "Orders", `Updated ${order.orderNumber} to ${status}`, req.ip);
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: "Failed to update order status." });
    }
});

// ─── DELETE - Delete Order (Admin) ────────────────────────────────────────────
router.delete("/:id", auth, adminOnly, async (req, res) => {
    try {
        const deleted = await Order.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Order not found." });

        await logAdminAction(req.user.id, "Delete Order", "Orders", `Deleted: ${deleted.orderNumber}`, req.ip);
        res.json({ message: "Order deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete order." });
    }
});

export default router;
