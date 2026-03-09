import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        contact: { type: String, default: "" },
        gender: { type: String, default: "" },
        dob: { type: Date, default: null },          // ✅ Fixed: Date type not String
        role: { type: String, enum: ["user"], default: "user" },
        addresses: {
            type: [{
                street: String,
                city: String,
                state: String,
                pincode: String,
                isDefault: { type: Boolean, default: false }
            }],
            default: []
        },
        wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
        verifiedAt: { type: Date, default: null },   // ✅ Fixed: Date type not String

        // ✅ Secure password reset — stores a hashed token, not plaintext
        resetPasswordToken: { type: String, default: null, select: false },
        resetPasswordExpires: { type: Date, default: null, select: false },

        otp: { type: String, default: null, select: false },
        otpExpiresAt: { type: Date, default: null, select: false },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
