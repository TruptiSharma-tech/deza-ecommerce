import mongoose from "mongoose";

const heroBannerSchema = new mongoose.Schema(
    {
        image: { type: String, required: true },         // base64 or URL
        title: { type: String, default: "" },
        subtitle: { type: String, default: "" },
        buttonText: { type: String, default: "Shop Now" },
        buttonLink: { type: String, default: "/shop" },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const heroSettingsSchema = new mongoose.Schema(
    {
        banners: { type: [heroBannerSchema], default: [] },
        headline: { type: String, default: "Luxury Perfumes for Every Mood" },
        subheadline: { type: String, default: "Discover the signature fragrance collection by DEZA. Elegant, bold, long-lasting perfumes designed to match your personality." },
        ctaText: { type: String, default: "Find Your Scent ✨" },
        ctaLink: { type: String, default: "/shop" },
    },
    { timestamps: true }
);

export default mongoose.model("HeroSettings", heroSettingsSchema);
