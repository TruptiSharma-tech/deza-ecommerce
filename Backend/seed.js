// Updated Seed Script for Professional Schema
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";
import Admin from "./models/Admin.js";
import Product from "./models/Product.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const ADMIN_EMAIL = "admin@deza.com";
const ADMIN_PASSWORD = "Admin@1234";

const sampleProducts = [
    {
        title: "DEZA Noir",
        description: "A bold, magnetic fragrance with deep notes of oud and leather. Perfect for powerful personalities.",
        fragrance: "Oud, Leather, Amber, Musk",
        types: ["Deza"],
        sizePrices: [{ size: "25ml", price: 999 }, { size: "50ml", price: 1799 }, { size: "100ml", price: 2999 }],
        stock: 50,
        sold: 120,
        mainImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=500",
        images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=500"],
        rating: 4.8,
        isFeatured: true
    },
    {
        title: "DEZA Blossom",
        description: "Soft floral luxury with notes of jasmine, rose, and peony. Timeless femininity.",
        fragrance: "Jasmine, Rose, Peony, Sandalwood",
        types: ["Deza"],
        sizePrices: [{ size: "25ml", price: 799 }, { size: "50ml", price: 1499 }, { size: "100ml", price: 2499 }],
        stock: 40,
        sold: 98,
        mainImage: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=500",
        images: ["https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=500"],
        rating: 4.7,
        isFeatured: true
    },
    {
        title: "DEZA Oud Royale",
        description: "Rich, royal, and timeless. The pinnacle of oriental fragrance for those who command respect.",
        fragrance: "Royal Oud, Saffron, Rose, Cedarwood",
        types: ["Deza"],
        sizePrices: [{ size: "25ml", price: 1299 }, { size: "50ml", price: 2299 }, { size: "100ml", price: 3999 }],
        stock: 30,
        sold: 75,
        mainImage: "https://images.unsplash.com/photo-1585232351009-aa87416fca90?q=80&w=500",
        images: ["https://images.unsplash.com/photo-1585232351009-aa87416fca90?q=80&w=500"],
        rating: 4.9,
    },
    {
        title: "DEZA Fresh Azure",
        description: "A crisp aquatic fragrance with notes of sea breeze, lime, and vetiver. Perfect for everyday wear.",
        fragrance: "Sea Breeze, Lime, Vetiver, White Musk",
        types: ["Recreational"],
        sizePrices: [{ size: "25ml", price: 699 }, { size: "50ml", price: 1199 }, { size: "100ml", price: 1999 }],
        stock: 60,
        sold: 55,
        mainImage: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=500",
        images: ["https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=500"],
        rating: 4.5,
    },
    {
        title: "DEZA Velvet Rose",
        description: "A luxurious rose-based fragrance with warm, velvety undertones. Elegant and sensual.",
        fragrance: "Damask Rose, Patchouli, Vanilla, Musk",
        types: ["Recreational"],
        sizePrices: [{ size: "25ml", price: 849 }, { size: "50ml", price: 1599 }, { size: "100ml", price: 2699 }],
        stock: 35,
        sold: 42,
        mainImage: "https://images.unsplash.com/photo-1601931935821-5fbe71157695?q=80&w=500",
        images: ["https://images.unsplash.com/photo-1601931935821-5fbe71157695?q=80&w=500"],
        rating: 4.6,
    },
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB Connected!");

        // 1. Create Admin in Admin collection
        const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL });
        if (existingAdmin) {
            console.log("ℹ️  Admin already exists in Admin collection:", ADMIN_EMAIL);
        } else {
            const hashedPw = await bcrypt.hash(ADMIN_PASSWORD, 10);
            await Admin.create({
                name: "DEZA Super Admin",
                email: ADMIN_EMAIL,
                password: hashedPw,
                role: "superadmin",
                permissions: ["all"]
            });
            console.log("✅ Super Admin created in Admin collection!");
        }

        // 2. Clear and Seed Products
        await Product.deleteMany({});
        for (const p of sampleProducts) {
            const product = new Product(p);
            await product.save(); // .save() triggers the slug generation middleware
        }
        console.log(`✅ Seeded ${sampleProducts.length} sample products with auto-generated slugs!`);

        console.log("\n🎉 Restructured Seed Complete!");
        console.log("   Admin Email:    " + ADMIN_EMAIL);
        process.exit(0);
    } catch (err) {
        console.error("❌ Seed failed:", err.message);
        process.exit(1);
    }
}

seed();
