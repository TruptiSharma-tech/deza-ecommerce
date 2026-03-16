import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        userName: { type: String, default: "Anonymous" },
        userEmail: { type: String, default: "" },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: "" },
        images: { type: [String], default: [] }, // Photo reviews
        isApproved: { type: Boolean, default: false }, // Moderation
    },
    { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);
