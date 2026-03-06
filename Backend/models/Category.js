import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String, default: "" },
        image: { type: String, default: "" },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
