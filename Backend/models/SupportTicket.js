import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        orderId: { type: String, default: "" }, // Linking to specific order if applicable
        ticketType: {
            type: String,
            enum: ["General Query", "Return Request", "Refund Request", "Exchange Request"],
            default: "General Query"
        },
        issueType: {
            type: String,
            enum: ["Delayed Delivery", "Wrong Product Received", "Damaged Product", "Payment Failed", "Other"],
            default: "Other"
        },
        message: { type: String, required: true },
        image: { type: String, default: "" }, // Proof/Invoice
        status: { type: String, enum: ["Pending", "In Progress", "Resolved"], default: "Pending" },
        adminReply: { type: String, default: "" },
        repliedAt: { type: Date },
        resolved: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model("SupportTicket", supportTicketSchema);
