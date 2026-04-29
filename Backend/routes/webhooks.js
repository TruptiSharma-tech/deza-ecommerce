import express from "express";
import Order from "../models/Order.js";
import { processAutomatedRefund } from "../utils/refundService.js";

const router = express.Router();

/**
 * SHIPROCKET WEBHOOK HANDLER
 * This route receives real-time tracking updates from Shiprocket.
 * Set this URL in your Shiprocket Dashboard -> Settings -> Webhooks
 */
router.post("/shiprocket", async (req, res) => {
    // SECURITY: Optional check for a secret token if you set one in Shiprocket
    // const secret = req.headers['x-shiprocket-secret'];
    // if (secret !== process.env.SHIPROCKET_WEBHOOK_TOKEN) return res.status(401).end();

    try {
        const { order_id, status, awb, current_status } = req.body;
        console.log(`📦 Shiprocket Webhook received for Order ID: ${order_id}, Status: ${current_status}`);

        // Find order by Shiprocket Order ID or AWB if we store it
        // Since we might be using our internal order ID as the reference in Shiprocket:
        const order = await Order.findOne({ 
            $or: [
                { orderNumber: order_id }, 
                { trackingNumber: awb }
            ] 
        });

        if (!order) {
            console.warn(`⚠️ Webhook Warning: Order ${order_id} not found in database.`);
            return res.status(200).json({ message: "Order not found, but acknowledged." });
        }

        // Map Shiprocket status to DEZA status
        // Reference: https://www.shiprocket.in/help/docs/webhooks/
        let newStatus = order.orderStatus;
        
        switch (String(status)) {
            case "6": newStatus = "Shipped"; break;
            case "7": newStatus = "Delivered"; break;
            case "17": newStatus = "Processing"; break; // Pickup Scheduled
            case "18": newStatus = "Picked Up"; break;  // Picked Up
            case "10": newStatus = "Cancelled"; break;
            case "13": newStatus = "Returned"; break;
        }

        if (newStatus !== order.orderStatus) {
            console.log(`✅ Updating Order ${order.orderNumber} status to ${newStatus} via Webhook.`);
            order.orderStatus = newStatus;
            order.statusHistory.push({ 
                status: newStatus, 
                comment: `Updated automatically via Shiprocket Webhook (Status: ${current_status})` 
            });

            if (awb) order.trackingNumber = awb;
            if (newStatus === "Delivered") order.deliveredAt = new Date();

            await order.save();

            // 🔥 TRIGGER AUTOMATED REFUND ON PICKUP
            if (newStatus === "Picked Up") {
                console.log(`💸 Return Pickup detected for #${order.orderNumber}. Initiating Automated Refund...`);
                processAutomatedRefund(order._id).catch(err => {
                    console.error(`❌ Automated Refund failed for #${order.orderNumber}:`, err.message);
                });
            }
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("❌ Shiprocket Webhook Error:", err.message);
        res.status(500).json({ error: "Webhook processing failed." });
    }
});

export default router;
