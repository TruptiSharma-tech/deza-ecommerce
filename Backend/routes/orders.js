import express from "express";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import { auth, adminOnly } from "../middleware/auth.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { sendEmail, getBrandedTemplate } from "../utils/emailHelper.js";
import { sendWhatsApp } from "../utils/whatsappHelper.js";

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
        const orders = await Order.find().populate("customerId", "name email").populate("shopId").sort({ createdAt: -1 });
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
        const isAdmin = req.user && (["superadmin", "manager", "support", "admin"].includes(req.user.role) || req.user.isAdmin === true);

        // Check if user is viewing their own orders or if admin
        if (req.user.email.toLowerCase() !== searchEmail && !isAdmin) {
            return res.status(403).json({ error: "Unauthorized access." });
        }

        // 🔍 Fetch user's phone to find WhatsApp orders too
        const userInDb = await User.findOne({ email: searchEmail });
        const userPhone = userInDb?.phoneNumber || userInDb?.contact || "";

        // Filter: Users don't see cancelled orders, but admins see everything
        // Build query to find by Email OR Phone Number
        let query = {};
        const conditions = [];
        
        if (searchEmail) conditions.push({ customerEmail: searchEmail });
        if (userPhone) conditions.push({ customerPhone: userPhone });

        if (conditions.length > 1) {
            query.$or = conditions;
        } else if (conditions.length === 1) {
            query = conditions[0];
        }

        // In "My Orders", we now show everything, but the UI can handle status-based display
        if (!isAdmin) {
            // query.orderStatus = { $ne: "Cancelled" }; // Removed filtering to allow users to see their cancelled orders
        }

        const orders = await Order.find(query).populate("shopId").sort({ createdAt: -1 });
        const mapped = orders.map(o => {
            try {
                const obj = o.toObject();
                return {
                    ...obj,
                    totalPrice: o.totalAmount || 0,
                    status: o.orderStatus || "Pending",
                    orderId: o.orderNumber || "DZ-GUEST"
                };
            } catch (mapErr) {
                console.error("Skipping corrupted order:", o._id, mapErr);
                return null;
            }
        }).filter(o => o !== null);

        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch orders." });
    }
});

// ─── GET Single Order (Tracking) ──────────────────────────────────────────────
router.get("/track/:orderNumber", async (req, res) => {
    try {
        const { orderNumber } = req.params;
        let query = { orderNumber };
        
        // If it looks like a MongoDB ObjectId, also try searching by _id as fallback
        if (mongoose.Types.ObjectId.isValid(orderNumber)) {
            query = { $or: [{ orderNumber }, { _id: orderNumber }] };
        }

        const order = await Order.findOne(query).populate("shopId");
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
            items, address, totalPrice, paymentMethod, paymentId, paymentStatus, orderSource
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

        const formattedAddress = typeof address === 'string' 
            ? { street: address } 
            : (address || {});

        // Fetch primary shop to assign to this order
        const primaryShop = await mongoose.model("Shop").findOne({ isPrimary: true });

        const newOrder = await Order.create({
            orderNumber,
            customerId: customerId || null,
            shopId: primaryShop?._id || null, // Dynamic shop assignment
            customerName: customerName || "Guest",
            customerPhone: customerPhone || "",
            customerEmail: customerEmail || "",
            items: mappedItems,
            shippingAddress: formattedAddress,
            totalAmount: Number(totalPrice) || 0,
            paymentMethod: paymentMethod || "Cash On Delivery",
            paymentStatus: paymentStatus || "Pending",
            paymentDetails: { paymentId },
            orderStatus: "Processing",
            statusHistory: [{ status: "Processing", comment: "Order placed successfully." }],
            orderSource: orderSource || "Website"
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
        console.error("🔥🔥 ORDER CREATION FAILED:", err);
        res.status(500).json({ error: "Failed to create order: " + err.message });
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


        // ─── SEND NOTIFICATIONS ───────────────────────────────────────────────
        try {
            const customerName = order.customerName || "Customer";
            const orderNum = order.orderNumber;
            const trackNum = trackingNumber || order.trackingNumber || "N/A";
            
            // 1. Email Notification
            let emailTitle = `Order Update: ${status}`;
            let emailBody = `
                <p>Hello ${customerName},</p>
                <p>Your order <strong>#${orderNum}</strong> status has been updated to: <span style="color: #d4af37; font-weight: bold;">${status}</span></p>
            `;

            if (status === "Shipped") {
                emailTitle = "Your DEZA Fragrance is En Route! 🚚";
                emailBody += `
                    <p>Good news! Your package has been handed over to our courier partner.</p>
                    <p><strong>Tracking ID:</strong> ${trackNum}</p>
                    <p>You can track your order live on our website under the 'My Orders' section.</p>
                `;
            } else if (status === "Delivered") {
                emailTitle = "Delivered: Enjoy your DEZA Luxury ✨";
                emailBody += `
                    <p>Your order has been successfully delivered. We hope you love your new signature scent!</p>
                    <p>Don't forget to share your experience by leaving a review on our website.</p>
                `;
            }

            const html = getBrandedTemplate(emailTitle, emailBody);
            await sendEmail(order.customerEmail, `DEZA Luxury Update - #${orderNum}`, html);

            // 2. WhatsApp Notification (Official API)
            // Now includes the Product Image for a professional look
            const productImage = order.items?.[0]?.image || "";
            await sendWhatsApp(order.customerPhone, "order_update", [productImage, customerName, orderNum, status]);

        } catch (notifyErr) {
            console.error("Notification trigger failed (silently):", notifyErr.message);
        }

        res.json(order);
    } catch (err) {
        console.error("Status update error:", err);
        res.status(500).json({ error: "Failed to update order status." });
    }
});

// ─── PATCH - Update Live GPS Tracking ──────────────────────────────────────────
router.patch("/:id/tracking", auth, async (req, res) => {
    try {
        const { lat, lng, isActive } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found." });

        if (lat !== undefined) order.liveTracking.lat = lat;
        if (lng !== undefined) order.liveTracking.lng = lng;
        if (isActive !== undefined) order.liveTracking.isActive = isActive;
        order.liveTracking.lastUpdated = new Date();

        await order.save();
        res.json(order.liveTracking);
    } catch (err) {
        res.status(500).json({ error: "Failed to update tracking." });
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

// ─── PATCH - Cancel Order (Safe Version) ──────────────────────────────────
router.patch("/:id/cancel", auth, async (req, res) => {
    console.log(`[CANCEL] Attempting to cancel order ${req.params.id} by ${req.user?.email}`);
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            console.log("[CANCEL] Order not found");
            return res.status(404).json({ error: "Order not found." });
        }

        // Security Check
        const orderEmail = (order.customerEmail || "").toLowerCase().trim();
        const userEmail = (req.user?.email || "").toLowerCase().trim();
        const isAdmin = req.user?.role === "admin" || req.user?.isAdmin === true;

        if (!isAdmin && orderEmail !== userEmail) {
            console.log(`[CANCEL] Security violation: User ${userEmail} tried to cancel ${orderEmail}'s order`);
            return res.status(403).json({ error: "Unauthorized access." });
        }

        // Check Status
        if (order.status === "Cancelled" || order.orderStatus === "Cancelled") {
            return res.status(400).json({ error: "Order is already cancelled." });
        }
        if (["Delivered", "Shipped"].includes(order.orderStatus)) {
            return res.status(400).json({ error: `Cannot cancel a ${order.orderStatus} order.` });
        }

        // 1. Restore Stock (Optional - don't let it crash the cancel)
        try {
            if (order.items && order.items.length > 0) {
                console.log(`[CANCEL] Restoring stock for ${order.items.length} items...`);
                for (const item of order.items) {
                    const productId = item.id || item._id;
                    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
                        await Product.findByIdAndUpdate(productId, {
                            $inc: { stock: item.qty || 1, sold: -(item.qty || 1) }
                        });
                    }
                }
            }
        } catch (stockErr) {
            console.error("[CANCEL] Stock restoration failed (ignoring):", stockErr);
        }

        // 2. Update Order (Using findByIdAndUpdate to bypass strict validation on unrelated fields)
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    orderStatus: "Cancelled",
                    cancelledAt: new Date()
                },
                $push: {
                    statusHistory: {
                        status: "Cancelled",
                        timestamp: new Date(),
                        comment: isAdmin ? "Cancelled by Admin" : "Cancelled by Customer"
                    }
                }
            },
            { new: true }
        );

        if (!updatedOrder) {
            throw new Error("Failed to update order status in database.");
        }

        console.log(`[CANCEL] Success: ${updatedOrder.orderNumber} cancelled`);

        // 3. Log Admin Action
        if (isAdmin) {
            await logAdminAction(req.user.id, "Cancel Order", "Orders", `Cancelled ${updatedOrder.orderNumber}`, req.ip);
        }

        // Response
        res.json({
            ...updatedOrder.toObject(),
            totalPrice: updatedOrder.totalAmount,
            status: updatedOrder.orderStatus,
            orderId: updatedOrder.orderNumber
        });
    } catch (err) {
        console.error("[CANCEL] CRITICAL SERVER ERROR:", err);
        res.status(500).json({ error: "Server error: " + err.message });
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

// ─── PATCH - Toggle Live Tracking ─────────────────────────────────────────────
router.patch("/:id/live-tracking", auth, adminOnly, async (req, res) => {
    try {
        const { isActive, lat, lng } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found." });

        order.liveTracking = {
            isActive: isActive !== undefined ? isActive : !order.liveTracking.isActive,
            lat: lat || order.liveTracking.lat,
            lng: lng || order.liveTracking.lng,
            lastUpdated: new Date()
        };

        await order.save();
        res.json({ message: `Live tracking ${order.liveTracking.isActive ? "enabled" : "disabled"}`, liveTracking: order.liveTracking });
    } catch (err) {
        res.status(500).json({ error: "Failed to update live tracking." });
    }
});

export default router;
