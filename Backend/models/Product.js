import mongoose from "mongoose";

const sizePriceSchema = new mongoose.Schema(
    {
        size: { type: String, required: true },
        price: { type: Number, required: true, min: [0.01, "Price must be greater than 0"] },
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, unique: true, lowercase: true }, // For SEO friendly URLs
        description: { type: String, default: "" },
        sku: { type: String, unique: true, sparse: true }, // Stock Keeping Unit
        fragrance: { type: String, default: "" },
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        categories: { type: [String], default: [] },
        brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
        types: { type: [String], default: [] },
        sizePrices: { type: [sizePriceSchema], default: [] },
        discountPrice: { type: Number, default: 0, min: 0 },
        stock: { type: Number, default: 0, min: [0, "Stock cannot be negative"] },
        sold: { type: Number, default: 0, min: 0 },
        images: { type: [String], default: [] },
        mainImage: { type: String, default: "" },
        rating: { type: Number, default: 0 },
        numReviews: { type: Number, default: 0 },
        isFeatured: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        isArchived: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Auto-generate slug before saving
productSchema.pre("save", function (next) {
    if (this.isModified("title")) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^\w ]+/g, "")
            .replace(/ +/g, "-");
    }
    next();
});

export default mongoose.model("Product", productSchema);
