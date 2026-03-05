import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.Mixed, required: true }, // supports old numeric IDs or ObjectId
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        userName: { type: String, default: "Anonymous" },
        userEmail: { type: String, default: "" },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: "" },
        date: { type: String, default: () => new Date().toLocaleString() },
    },
    { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);
