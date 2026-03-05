import mongoose from "mongoose";

const sizePriceSchema = new mongoose.Schema(
    {
        size: { type: String, required: true },
        price: { type: Number, required: true },
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        fragrance: { type: String, default: "" },
        categories: { type: [String], default: [] },
        types: { type: [String], default: [] },
        sizePrices: { type: [sizePriceSchema], default: [] },
        stock: { type: Number, default: 0 },
        sold: { type: Number, default: 0 },
        images: { type: [String], default: [] },  // base64 or URLs
        image: { type: String, default: "" },     // primary image
        rating: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export default mongoose.model("Product", productSchema);
