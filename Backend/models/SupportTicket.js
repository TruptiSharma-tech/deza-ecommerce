import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // Optional for non-logged-in users
        name: { type: String, required: true },
        email: { type: String, required: true },
        orderId: { type: String, default: "" }, 
        ticketType: {
            type: String,
            enum: ["General Query", "Return Request", "Refund Request", "Exchange Request", "Return / Refund", "General Support"],
            default: "General Query"
        },
        issueType: { type: String, default: "Other" },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Urgent"],
            default: "Medium"
        },
        subject: { type: String, default: "" },
        message: { type: String, required: true },
        image: { type: String, default: "" }, // Legacy single image support
        images: { type: [String], default: [] }, // Support multiple images
        status: { 
            type: String, 
            enum: ["Pending", "In Progress", "Closed", "Resolved", "Waiting for Customer"], 
            default: "Pending" 
        },
        adminReply: { type: String, default: "" },
        repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
        repliedAt: { type: Date },
        resolved: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model("SupportTicket", supportTicketSchema);
