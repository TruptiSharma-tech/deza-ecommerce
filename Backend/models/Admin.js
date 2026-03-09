import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ["superadmin", "manager", "support"],
            default: "superadmin"
        },
        permissions: {
            type: [String],
            default: ["all"], // e.g., ["manage_products", "view_orders", "manage_users"]
        },
        lastLogin: { type: Date, default: null },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
    },
    { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
