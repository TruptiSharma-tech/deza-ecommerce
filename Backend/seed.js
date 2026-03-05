// Script to: 1) Create an admin account, 2) Seed sample products
// Run: node seed.js

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// ─── Schemas (inline, no separate model files needed here) ────────────────────
const userSchema = new mongoose.Schema({ name: String, email: String, password: String, role: String });
const User = mongoose.model("User", userSchema);

const productSchema = new mongoose.Schema({
    title: String, description: String, fragrance: String,
    categories: [String], types: [String],
    sizePrices: [{ size: String, price: Number }],
    stock: Number, sold: Number, images: [String], image: String, rating: Number,
}, { timestamps: true });
const Product = mongoose.model("Product", productSchema);

// ─── Admin credentials ─────────────────────────────────────────────────────────
const ADMIN_EMAIL = "admin@deza.com";
const ADMIN_PASSWORD = "Admin@1234";

// ─── Sample Products ───────────────────────────────────────────────────────────
const sampleProducts = [
    {
        title: "DEZA Noir",
        description: "A bold, magnetic fragrance with deep notes of oud and leather. Perfect for powerful personalities.",
        fragrance: "Oud, Leather, Amber, Musk",
        categories: ["Men", "Unisex"],
        types: ["Deza"],
        sizePrices: [{ size: "25ml", price: 999 }, { size: "50ml", price: 1799 }, { size: "100ml", price: 2999 }],
        stock: 50,
        sold: 120,
        image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=500",
        images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=500"],
        rating: 4.8,
    },
    {
        title: "DEZA Blossom",
        description: "Soft floral luxury with notes of jasmine, rose, and peony. Timeless femininity.",
        fragrance: "Jasmine, Rose, Peony, Sandalwood",
        categories: ["Women"],
        types: ["Deza"],
        sizePrices: [{ size: "25ml", price: 799 }, { size: "50ml", price: 1499 }, { size: "100ml", price: 2499 }],
        stock: 40,
        sold: 98,
        image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=500",
        images: ["https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=500"],
        rating: 4.7,
    },
    {
        title: "DEZA Oud Royale",
        description: "Rich, royal, and timeless. The pinnacle of oriental fragrance for those who command respect.",
        fragrance: "Royal Oud, Saffron, Rose, Cedarwood",
        categories: ["Unisex"],
        types: ["Deza"],
        sizePrices: [{ size: "25ml", price: 1299 }, { size: "50ml", price: 2299 }, { size: "100ml", price: 3999 }],
        stock: 30,
        sold: 75,
        image: "https://images.unsplash.com/photo-1585232351009-aa87416fca90?q=80&w=500",
        images: ["https://images.unsplash.com/photo-1585232351009-aa87416fca90?q=80&w=500"],
        rating: 4.9,
    },
    {
        title: "DEZA Fresh Azure",
        description: "A crisp aquatic fragrance with notes of sea breeze, lime, and vetiver. Perfect for everyday wear.",
        fragrance: "Sea Breeze, Lime, Vetiver, White Musk",
        categories: ["Men", "Unisex"],
        types: ["Recreational"],
        sizePrices: [{ size: "25ml", price: 699 }, { size: "50ml", price: 1199 }, { size: "100ml", price: 1999 }],
        stock: 60,
        sold: 55,
        image: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=500",
        images: ["https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=500"],
        rating: 4.5,
    },
    {
        title: "DEZA Velvet Rose",
        description: "A luxurious rose-based fragrance with warm, velvety undertones. Elegant and sensual.",
        fragrance: "Damask Rose, Patchouli, Vanilla, Musk",
        categories: ["Women"],
        types: ["Recreational"],
        sizePrices: [{ size: "25ml", price: 849 }, { size: "50ml", price: 1599 }, { size: "100ml", price: 2699 }],
        stock: 35,
        sold: 42,
        image: "https://images.unsplash.com/photo-1601931935821-5fbe71157695?q=80&w=500",
        images: ["https://images.unsplash.com/photo-1601931935821-5fbe71157695?q=80&w=500"],
        rating: 4.6,
    },
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB Connected!");

        // 1. Create Admin
        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
        if (existingAdmin) {
            console.log("ℹ️  Admin already exists:", ADMIN_EMAIL);
        } else {
            const hashedPw = await bcrypt.hash(ADMIN_PASSWORD, 10);
            await User.create({ name: "DEZA Admin", email: ADMIN_EMAIL, password: hashedPw, role: "admin" });
            console.log("✅ Admin created:", ADMIN_EMAIL, "/ password:", ADMIN_PASSWORD);
        }

        // 2. Seed Products
        const existingCount = await Product.countDocuments();
        if (existingCount > 0) {
            console.log(`ℹ️  ${existingCount} products already exist. Skipping seed.`);
        } else {
            await Product.insertMany(sampleProducts);
            console.log(`✅ Seeded ${sampleProducts.length} sample products!`);
        }

        console.log("\n🎉 Setup Complete!");
        console.log("   Admin Email:    " + ADMIN_EMAIL);
        console.log("   Admin Password: " + ADMIN_PASSWORD);
        process.exit(0);
    } catch (err) {
        console.error("❌ Seed failed:", err.message);
        process.exit(1);
    }
}

seed();
