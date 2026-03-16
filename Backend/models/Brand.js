import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        slug: { type: String, unique: true, lowercase: true },
        image: { type: String, default: "" }, // Base64 or URL
        description: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
        isFeatured: { type: Boolean, default: false },
        metaTitle: { type: String, trim: true },
        metaDescription: { type: String, trim: true },
    },
    { timestamps: true }
);

// Auto-generate slug before saving
brandSchema.pre("save", function (next) {
    if (this.isModified("name")) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^\w ]+/g, "")
            .replace(/ +/g, "-");
    }
    next();
});

export default mongoose.model("Brand", brandSchema);
