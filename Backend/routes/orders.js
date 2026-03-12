import express from "express";
import { nanoid } from "nanoid";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
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

// ─── GET My Orders (by Email) ────────────────────────────────────────────────
router.get("/my/:email", auth, async (req, res) => {
    try {
        const searchEmail = req.params.email.toLowerCase().trim();
        // Check if user is viewing their own orders or if admin
        if (req.user.email.toLowerCase() !== searchEmail && req.user.role !== "admin") {
            return res.status(403).json({ error: "Unauthorized access." });
        }

        const orders = await Order.find({ customerEmail: searchEmail }).sort({ createdAt: -1 });
        const mapped = orders.map(o => ({
            ...o.toObject(),
            totalPrice: o.totalAmount,
            status: o.orderStatus,
            orderId: o.orderNumber
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch orders." });
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
            customerId, customerName, customerPhone, customerEmail,
            items, address, totalPrice, paymentMethod, paymentId, paymentStatus
        } = req.body;

        const orderNumber = `DZ-${nanoid(10).toUpperCase()}`;
        // ✅ Map item _id to id for schema compatibility
        const mappedItems = (items || []).map(item => ({
            id: item._id || item.id || item.productId,
            name: item.name,
            image: item.image,
            selectedSize: item.selectedSize,
            price: item.price,
            qty: item.qty || 1,
        }));

        const newOrder = await Order.create({
            orderNumber,
            customerId: customerId || null,
            customerName: customerName || "Guest",
            customerPhone: customerPhone || "",
            customerEmail: customerEmail || "",
            items: mappedItems,
            shippingAddress: address || {},
            totalAmount: Number(totalPrice) || 0,
            paymentMethod: paymentMethod || "Cash On Delivery",
            paymentStatus: paymentStatus || "Pending",
            paymentDetails: { paymentId },
            orderStatus: "Processing",
            statusHistory: [{ status: "Processing", comment: "Order placed successfully." }]
        });

        // ✅ REDUCE STOCK FOR EACH ITEM
        for (const item of mappedItems) {
            if (item.id) {
                try {
                    await Product.findByIdAndUpdate(item.id, {
                        $inc: { stock: -(item.qty || 1), sold: (item.qty || 1) }
                    });
                } catch (stockErr) {
                    console.error(`Failed to update stock for product ${item.id}:`, stockErr);
                }
            }
        }

        // Send Email Confirmation
        if (customerEmail) {
            const body = `
                <h3>Order Confirmation</h3>
                <p>Hello ${customerName},</p>
                <p>Thank you for choosing DEZA Luxury. Your order <b>${orderNumber}</b> has been received and is being processed.</p>
                <p><b>Order Details:</b></p>
                <ul>
                    ${items.map(i => `<li>${i.name} (x${i.qty}) - ₹${i.price * i.qty}</li>`).join('')}
                </ul>
                <p><b>Total Amount:</b> ₹${totalPrice}</p>
                <p><b>Shipping to:</b> ${typeof address === 'string' ? address : (address.street + ', ' + address.city)}</p>
                <p>We will notify you once your signature scent is shipped.</p>
            `;
            const template = getBrandedTemplate("Order Placed Successfully", body);
            await sendEmail(customerEmail, `DEZA Luxury - Order Confirmation #${orderNumber}`, template);
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

// ─── USER ACTIONS (Cancel, Return, Refund) ───────────────────────────────────

router.patch("/:id/cancel", async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found." });

        if (order.orderStatus === "Delivered" || order.orderStatus === "Cancelled") {
            return res.status(400).json({ error: "Order cannot be cancelled at this stage." });
        }

        order.orderStatus = "Cancelled";
        order.cancelledAt = new Date();
        order.statusHistory.push({ status: "Cancelled", comment: "Cancelled by User" });

        await order.save();

        // Always return mapped structure
        res.json({
            ...order.toObject(),
            totalPrice: order.totalAmount,
            status: order.orderStatus,
            orderId: order.orderNumber
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to cancel order." });
    }
});

router.patch("/:id/return", auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found." });

        const { returnType, reason, message } = req.body;
        order.returnDetails = {
            reason,
            requestDate: new Date(),
            status: "Pending"
        };
        // Add to history
        order.statusHistory.push({ status: "Return Requested", comment: message });

        await order.save();

        res.json({
            ...order.toObject(),
            totalPrice: order.totalAmount,
            status: order.orderStatus,
            orderId: order.orderNumber
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to submit return request." });
    }
});

router.patch("/:id/refund", auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found." });

        order.refundStatus = "Refund Requested";
        order.statusHistory.push({ status: "Refund Requested", comment: "Refund requested by User" });

        await order.save();

        res.json({
            ...order.toObject(),
            totalPrice: order.totalAmount,
            status: order.orderStatus,
            orderId: order.orderNumber
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to request refund." });
    }
});

export default router;
