import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        contact: { type: String, default: "" },
        phoneNumber: { 
            type: String, 
            trim: true,
            validate: {
                validator: function(v) {
                    return v === "" || /\d{10}/.test(v);
                },
                message: props => `${props.value} is not a valid phone number!`
            }
        },
        gender: { type: String, default: "" },
        dob: { type: Date, default: null },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        addresses: [
            {
                label: { type: String, default: "Home" }, // Home, Office, etc.
                street: String,
                area: String,
                city: String,
                state: String,
                pincode: String,
                country: { type: String, default: "India" },
                isDefault: { type: Boolean, default: false }
            }
        ],
        wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
        cart: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
                qty: { type: Number, default: 1 },
                selectedSize: { type: String, default: "" }
            }
        ],
        verifiedAt: { type: Date, default: null },
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date, default: null },

        // Secure password reset — stores a hashed token, not plaintext
        resetPasswordToken: { type: String, default: null, select: false },
        resetPasswordExpires: { type: Date, default: null, select: false },

        otp: { type: String, default: null, select: false },
        otpExpiresAt: { type: Date, default: null, select: false },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
