import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        customerEmail: { type: String, required: true },
        transactionId: { type: String, required: true, unique: true },
        gateway: { type: String, enum: ["Razorpay", "Stripe", "PayPal", "COD"], default: "Razorpay" },
        amount: { type: Number, required: true },
        currency: { type: String, default: "INR" },
        status: { 
            type: String, 
            enum: ["Pending", "Successful", "Failed", "Refunded"], 
            default: "Successful" 
        },
        paymentMethod: { type: String, default: "Card/UPI" },
        paidAt: { type: Date, default: Date.now },
        gatewayResponse: { type: mongoose.Schema.Types.Mixed }, // Store full response for auditing
    },
    { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
