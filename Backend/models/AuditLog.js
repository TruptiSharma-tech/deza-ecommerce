import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
        action: { type: String, required: true },
        details: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
        module: { type: String, default: "General" },
        ipAddress: { type: String, default: "0.0.0.0" },
    },
    { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
