import express from "express";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { processAutomatedRefund } from "../utils/refundService.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import { auth, adminOnly } from "../middleware/auth.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import SupportTicket from "../models/SupportTicket.js";
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

// ─── GET My Orders (Secure - based on token) ───────────────────────────────────
router.get("/me", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email?.toLowerCase().trim();
        
        console.log(`📡 [API] Secure Order Request - ID: ${userId}, Email: ${userEmail}`);

        // 🔗 Strict Privacy Query
        const conditions = [];
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            conditions.push({ customerId: userId });
        }
        if (userEmail && userEmail.length > 3) {
            conditions.push({ customerEmail: userEmail });
        }

        if (conditions.length === 0) {
            return res.json([]); // Return empty if no valid identifiers
        }

        const query = { $or: conditions };
        const orders = await Order.find(query).populate("shopId").sort({ createdAt: -1 });
        const mapped = orders.map(o => ({
            ...o.toObject(),
            totalPrice: o.totalAmount || 0,
            status: o.orderStatus || "Pending",
            orderId: o.orderNumber || "DZ-GUEST"
        }));

        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch your orders." });
    }
});

// ─── GET My Orders (by Email - Admin or Self) ──────────────────────────────────
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
        if (userPhone && userPhone.trim() !== "") conditions.push({ customerPhone: userPhone });

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
            items, address, shippingAddress, totalPrice, totalAmount, shippingFee, handlingFee, codFee, paymentMethod, paymentId, paymentStatus, orderSource
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

        const finalAddress = shippingAddress || address;
        const formattedAddress = typeof finalAddress === 'string' 
            ? { street: finalAddress } 
            : (finalAddress || {});

        const finalTotal = Number(totalAmount || totalPrice) || 0;
        const finalShippingFee = Number(shippingFee) || 0;
        const finalHandlingFee = Number(handlingFee) || 0;
        const finalCodFee = Number(codFee) || 0;

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
            totalAmount: finalTotal,
            shippingFee: finalShippingFee,
            handlingFee: finalHandlingFee,
            codFee: finalCodFee,
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
        if (customerEmail && customerEmail.includes("@")) {
            try {
                const subtotal = mappedItems.reduce((sum, i) => sum + (i.price * i.qty), 0);
                const body = `
                    <p>Dear ${customerName},</p>
                    <p>Your order for luxury fragrances has been confirmed! We are currently preparing your signature scents for delivery.</p>
                    
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #d4af37;">
                        <h4 style="margin-top:0; color:#d4af37;">Order Summary: #${orderNumber}</h4>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 1px solid #ddd; text-align: left;">
                                    <th style="padding: 10px 0;">Item</th>
                                    <th style="padding: 10px 0; text-align: center;">Qty</th>
                                    <th style="padding: 10px 0; text-align: right;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${mappedItems.map(i => `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 10px 0;">${i.name} (${i.selectedSize})</td>
                                        <td style="padding: 10px 0; text-align: center;">${i.qty}</td>
                                        <td style="padding: 10px 0; text-align: right;">₹${(i.price * i.qty).toLocaleString("en-IN")}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div style="text-align: right; margin-top: 15px; font-size: 14px;">
                            Subtotal: ₹${subtotal.toLocaleString("en-IN")}<br />
                            Shipping: ₹${finalShippingFee.toLocaleString("en-IN")}<br />
                            ${finalHandlingFee > 0 ? `Handling Fee (2%): ₹${finalHandlingFee.toLocaleString("en-IN")}<br />` : ""}
                            ${finalCodFee > 0 ? `COD Fee: ₹${finalCodFee.toLocaleString("en-IN")}<br />` : ""}
                        </div>
                        <div style="text-align: right; margin-top: 10px; font-weight: bold; font-size: 18px; color: #1a1a1a;">
                            Total Amount: ₹${finalTotal.toLocaleString("en-IN")}
                        </div>
                    </div>

                    <div style="margin-top: 25px;">
                        <p><b>Shipping Address:</b><br />
                        ${customerName}<br />
                        ${formattedAddress.street || ""}, ${formattedAddress.area || ""}<br />
                        ${formattedAddress.city || ""}, ${formattedAddress.state || ""} - ${formattedAddress.pincode || ""}</p>
                    </div>

                    <p style="margin-top: 30px;">We will send you a tracking link as soon as your package is dispatched. Thank you for choosing the essence of luxury.</p>
                `;
                const template = getBrandedTemplate("Your Order is Confirmed ✨", body);
                await sendEmail(customerEmail.toLowerCase().trim(), `DEZA Luxury - Order Confirmation #${orderNumber}`, template);
                console.log(`✅ Order confirmation email sent to ${customerEmail}`);



                // 📱 WHATSAPP NOTIFICATION (Live)
                try {
                    // Try to send official WhatsApp notification if credentials exist
                    await sendWhatsApp(formData.contact || "", "order_confirmation", [customerName, orderNumber, `₹${totalPrice.toLocaleString("en-IN")}`]);
                    console.log(`📱 WhatsApp notification triggered for ${customerName}`);
                } catch (waErr) {
                    console.warn("⚠️ WhatsApp notification failed (check API config):", waErr.message);
                }
            } catch (emailErr) {
                console.error("❌ Notification error:", emailErr.message);
            }
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
        
        // ✅ NEW: AUTOMATED REFUND ON PICKUP
        if (status === "Picked Up") {
            console.log(`🚛 Order ${order.orderNumber} Picked Up. Triggering Automated Refund...`);
            processAutomatedRefund(order._id).catch(e => console.error("Pickup refund failed:", e.message));
        }

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

        // ✅ NEW: Create a Support Ticket (Query) for this Return Request
        try {
            await SupportTicket.create({
                name: order.customerName || "Customer",
                email: order.customerEmail || req.user.email,
                message: `[AUTO-GENERATED RETURN REQUEST]\nType: ${returnType}\nReason: ${reason}\nMessage: ${message || "No additional message."}`,
                orderId: order.orderNumber,
                ticketType: "Return / Refund",
                issueType: returnType === "Refund" ? "Refund Request" : "Exchange Request",
                status: "Pending"
            });
        } catch (ticketErr) {
            console.error("Failed to auto-create support ticket for return:", ticketErr);
        }

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

        // ✅ NEW: Create a Support Ticket (Query) for this Refund Request
        try {
            await SupportTicket.create({
                name: order.customerName || "Customer",
                email: order.customerEmail || req.user.email,
                message: `[AUTO-GENERATED REFUND REQUEST]\nThe user has requested a refund for order ${order.orderNumber}.`,
                orderId: order.orderNumber,
                ticketType: "Return / Refund",
                issueType: "Refund Request",
                status: "Pending"
            });
        } catch (ticketErr) {
            console.error("Failed to auto-create support ticket for refund:", ticketErr);
        }

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
