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
        date: String,
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        orderId: { type: String, unique: true }, // Custom ID field
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        customerName: { type: String, default: "" },
        customerPhone: { type: String, default: "" },
        customerEmail: { type: String, default: "" },
        address: { type: addressSchema, default: {} },
        items: { type: [orderItemSchema], default: [] },
        totalPrice: { type: Number, default: 0 },
        paymentMethod: { type: String, default: "Cash On Delivery" },
        paymentId: { type: String, default: "" },
        paymentStatus: { type: String, default: "Pending" },
        status: {
            type: String,
            enum: ["Pending", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
            default: "Pending",
        },
        returnStatus: { type: String, default: "Not Requested" },
        refundStatus: { type: String, default: "Not Requested" },
        returnRequest: { type: returnRequestSchema, default: null },
        refundRequestDate: { type: String, default: "" },
        category: { type: String, default: "" },
        type: { type: String, default: "" },
        date: { type: String, default: () => new Date().toLocaleString() },
        deliveredAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
