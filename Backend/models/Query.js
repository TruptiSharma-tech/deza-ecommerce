import mongoose from "mongoose";

const querySchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        message: { type: String, required: true },
        image: { type: String, default: "" },  // base64 image
        status: { type: String, enum: ["Pending", "Resolved"], default: "Pending" },
        priority: { type: String, default: "Normal" },
        adminReply: { type: String, default: "" },
        repliedAt: { type: String, default: "" },
        resolved: { type: Boolean, default: false },
        refundStatus: { type: String, enum: ["None", "Initiated", "Completed"], default: "None" },
        date: { type: String, default: () => new Date().toLocaleString() },
    },
    { timestamps: true }
);

export default mongoose.model("Query", querySchema);
