import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        slug: { type: String, unique: true, lowercase: true },
        description: { type: String, default: "" },
        image: { type: String, default: "" },
        parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
        active: { type: Boolean, default: true },
        isFeatured: { type: Boolean, default: false },
        metaTitle: { type: String, trim: true },
        metaDescription: { type: String, trim: true },
    },
    { timestamps: true }
);

// Auto-generate slug before saving
categorySchema.pre("save", function (next) {
    if (this.isModified("name")) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^\w ]+/g, "")
            .replace(/ +/g, "-");
    }
    next();
});

export default mongoose.model("Category", categorySchema);
