import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
        customerEmail: { type: String, required: true },
        transactionId: { type: String, required: true, unique: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: "INR" },
        status: { type: String, enum: ["Pending", "Successful", "Failed"], default: "Successful" },
        paymentMethod: { type: String, default: "Card/UPI" },
        paidAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
