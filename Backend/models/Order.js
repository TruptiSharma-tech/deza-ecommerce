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
        orderNumber: { type: String, required: true, unique: true },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" }, // New Field
        customerName: { type: String, required: true },
        customerEmail: { type: String, default: "" },
        customerPhone: { type: String, default: "" },
        items: { type: [orderItemSchema], required: true },
        shippingAddress: { type: addressSchema, required: true },
        billingAddress: { type: addressSchema },
        totalAmount: { type: Number, required: true },
        discountAmount: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        shippingFee: { type: Number, default: 0 },
        currency: { type: String, default: "INR" },
        paymentMethod: { type: String, required: true },
        paymentStatus: { 
            type: String, 
            enum: ["Pending", "Paid", "Failed", "Refunded"], 
            default: "Pending" 
        },
        paymentDetails: mongoose.Schema.Types.Mixed,
        orderStatus: {
            type: String,
            enum: ["Pending", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Returned"],
            default: "Pending",
        },
        statusHistory: [statusHistorySchema],
        coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
        trackingNumber: { type: String, default: "" },
        deliveryCompany: { type: String, default: "" },
        estimatedDeliveryDate: { type: Date },
        deliveredAt: { type: Date },
        cancelledAt: { type: Date },
        returnDetails: {
            reason: String,
            requestDate: Date,
            status: { type: String, enum: ["None", "Pending", "Approved", "Rejected"], default: "None" },
        },
        orderSource: { type: String, default: "Website" },
        refundStatus: { type: String, default: "Not Requested" },
        returnStatus: { type: String, default: "Not Requested" },
        liveTracking: {
            lat: { type: Number, default: 19.1726 }, // Mulund West, Mumbai
            lng: { type: Number, default: 72.9425 },
            lastUpdated: { type: Date, default: Date.now },
            isActive: { type: Boolean, default: false }
        }
    },
    { timestamps: true }
);

// Performance Indexes
orderSchema.index({ customerId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
