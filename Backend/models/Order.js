import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        id: mongoose.Schema.Types.Mixed,
        name: String,
        image: String,
        selectedSize: String,
        price: Number,
        qty: Number,
    },
    { _id: false }
);

const addressSchema = new mongoose.Schema(
    {
        street: String,
        area: String,
        city: String,
        state: String,
        pincode: String,
        country: String,
    },
    { _id: false }
);

const returnRequestSchema = new mongoose.Schema(
    {
        type: String,
        reason: String,
        message: String,
        date: { type: Date, default: Date.now }, // ✅ Fixed: Date type
    },
    { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
    {
        status: String,
        timestamp: { type: Date, default: Date.now },
        comment: String,
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        orderNumber: { type: String, unique: true }, // Human readable order number
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
        customerName: { type: String, default: "" },
        customerEmail: { type: String, default: "" },
        customerPhone: { type: String, default: "" },
        items: { type: [orderItemSchema], required: true },
        shippingAddress: { type: mongoose.Schema.Types.Mixed, required: true },
        billingAddress: { type: mongoose.Schema.Types.Mixed },
        totalAmount: { type: Number, required: true },
        taxAmount: { type: Number, default: 0 },
        shippingFee: { type: Number, default: 0 },
        paymentMethod: { type: String, required: true },
        paymentStatus: { type: String, default: "Pending" },
        paymentDetails: mongoose.Schema.Types.Mixed,
        orderStatus: {
            type: String,
            default: "Pending",
        },
        statusHistory: [statusHistorySchema],
        trackingNumber: { type: String, default: "" },
        deliveryCompany: { type: String, default: "" },
        estimatedDeliveryDate: { type: Date },
        deliveredAt: { type: Date },
        cancelledAt: { type: Date },
        returnDetails: {
            reason: String,
            requestDate: Date,
            status: { type: String, enum: ["None", "Pending", "Approved", "Rejected"], default: "None" },
        }
    },
    { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
