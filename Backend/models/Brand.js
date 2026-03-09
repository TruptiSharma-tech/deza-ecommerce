import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        image: { type: String, default: "" }, // Base64 or URL
        description: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model("Brand", brandSchema);
