import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        contact: { type: String, default: "" },
        gender: { type: String, default: "" },
        dob: { type: String, default: "" },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        verifiedAt: { type: String, default: "" },
        otp: { type: String, default: null },
        otpExpiresAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
