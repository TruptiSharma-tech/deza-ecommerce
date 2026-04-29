import razorpay from "./razorpay.js";
import Order from "../models/Order.js";
import { sendEmail, getBrandedTemplate } from "./emailHelper.js";

/**
 * Automatically processes a refund for a given order.
 * @param {string} orderId - The MongoDB ID of the order.
 * @param {string} reason - Reason for refund.
 */
export const processAutomatedRefund = async (orderId, reason = "Order Picked Up - Automated Refund") => {
    try {
        const order = await Order.findById(orderId);
        if (!order) throw new Error("Order not found");
        if (order.refundStatus === "Completed") return { success: true, message: "Refund already completed" };

        const paymentId = order.paymentDetails?.paymentId;
        const paymentMethod = order.paymentMethod || "Cash On Delivery";
        let razorpayRefundId = "N/A";
        let timeline = "24-48 Hours";

        // 1. Logic for Refund Speed and Execution
        if (paymentMethod === "Cash On Delivery") {
            // For COD, manual process is usually required, but we mark as initiated
            razorpayRefundId = "COD_REFUND_PENDING";
            order.refundStatus = "Initiated";
            timeline = "24 Hours (via UPI/Bank)";
        } else if (paymentId && paymentId.startsWith("DUMMY_")) {
            razorpayRefundId = "DUMMY_REFUND_" + Date.now();
            order.refundStatus = "Completed";
            timeline = "Instant (Test Mode)";
        } else if (paymentId) {
            try {
                // Determine timeline based on payment type (if possible from paymentId or method)
                // Razorpay standard: UPI is faster, Cards take 5-7 days.
                // We will communicate the user's specific timelines in the email.
                
                const refund = await razorpay.payments.refund(paymentId, {
                    amount: Math.round(order.totalAmount * 100),
                    notes: { orderNumber: order.orderNumber, reason }
                });
                
                razorpayRefundId = refund.id;
                order.refundStatus = "Completed";
                
                // Typical Razorpay refund timelines:
                // UPI/Wallet: Often < 24h
                // Cards: 5-7 days
                timeline = paymentMethod.toLowerCase().includes("card") ? "2-5 Business Days" : "24 Hours";
                if (paymentMethod.toLowerCase().includes("wallet")) timeline = "Instant";

            } catch (rzpErr) {
                console.error("Razorpay automated refund failed:", rzpErr);
                order.refundStatus = "Failed";
                throw rzpErr;
            }
        }

        // 2. Update Order
        order.statusHistory.push({ 
            status: "Refund Processed", 
            comment: `Automated Refund (${paymentMethod}): ${razorpayRefundId}. Timeline: ${timeline}` 
        });
        await order.save();

        // 3. Send Professional Email
        await sendRefundConfirmationEmail(order, razorpayRefundId, timeline);

        return { success: true, refundId: razorpayRefundId, timeline };
    } catch (err) {
        console.error("Automated Refund Error:", err);
        return { success: false, error: err.message };
    }
};

const sendRefundConfirmationEmail = async (order, refundId, timeline) => {
    const emailBody = `
        <div style="font-family: 'Times New Roman', serif; line-height: 1.8; color: #1a1a1a;">
            <p>Dear ${order.customerName},</p>
            
            <p>We are pleased to inform you that your return pickup for order <b>#${order.orderNumber}</b> has been completed. As per our <b>Luxury Promise</b>, your refund has been initiated immediately.</p>
            
            <div style="background: #f9f7f2; border: 1px solid #d4af37; padding: 20px; border-radius: 10px; margin: 25px 0;">
                <h3 style="color: #d4af37; margin-top: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 14px;">Refund Summary</h3>
                <p style="margin: 5px 0;"><b>Refund Amount:</b> ₹${order.totalAmount.toLocaleString()}</p>
                <p style="margin: 5px 0;"><b>Transaction ID:</b> ${refundId}</p>
                <p style="margin: 5px 0;"><b>Method:</b> ${order.paymentMethod}</p>
                <p style="margin: 5px 0; color: #d4af37; font-weight: bold;"><b>Expected Credit:</b> ${timeline}</p>
            </div>

            <p><b>Refund Timelines Breakdown:</b></p>
            <ul>
                <li><b>UPI Payments:</b> Within 24 Hours.</li>
                <li><b>Card Payments:</b> 2-5 Business Days (as per bank norms).</li>
                <li><b>Wallet Payments:</b> Instant Credit.</li>
            </ul>

            <p>We hope to provide you with a more delightful experience in your next purchase. Thank you for choosing DEZA.</p>
            
            <p style="margin-top: 40px;">Warm regards,</p>
            <p><b>Finance & Concierge Team</b><br/>
            DEZA Luxury Fragrances</p>
        </div>
    `;
    const template = getBrandedTemplate("Your Refund is on its way ✨", emailBody);
    await sendEmail(order.customerEmail, `[DEZA Luxury] Refund Initiated for Order #${order.orderNumber}`, template);
};
