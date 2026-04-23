import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import Category from "./models/Category.js";
import Brand from "./models/Brand.js";
import User from "./models/User.js";
import Admin from "./models/Admin.js";

dotenv.config();

async function seedEssentials() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        // 1. Seed Categories
        const categories = ["Women", "Men", "Unisex"];
        for (const name of categories) {
            await Category.findOneAndUpdate(
                { name },
                { name, active: true, isFeatured: true },
                { upsert: true, new: true }
            );
            console.log(`Ensured Category: ${name}`);
        }

        // 2. Seed Brands (Exactly as requested)
        const brands = ["DEZA", "recreational"];
        for (const name of brands) {
            await Brand.findOneAndUpdate(
                { name },
                { name, isActive: true, isFeatured: true },
                { upsert: true, new: true }
            );
            console.log(`Ensured Brand: ${name}`);
        }
        
        // Remove old name if exists
        await Brand.deleteOne({ name: "Recreational perfumes" });

        // 3. Re-create Admin Account in the CORRECT collection
        const hashedPw = await bcrypt.hash("Admin@Deza2026!", 12);
        
        // Ensure Admin exists in Admin collection
        await Admin.findOneAndUpdate(
            { email: "admin@deza.com" },
            { 
                name: "Master Admin", 
                email: "admin@deza.com", 
                password: hashedPw, 
                role: "superadmin",
                permissions: ["all"],
                status: "active"
            },
            { upsert: true, new: true }
        );
        
        // Also create as a backup User (optional but helpful for some routes)
        await User.findOneAndUpdate(
            { email: "admin@deza.com" },
            { 
                name: "Master Admin", 
                email: "admin@deza.com", 
                password: hashedPw, 
                role: "admin",
                verifiedAt: new Date()
            },
            { upsert: true, new: true }
        );

        console.log("✅ Admin account ensured: admin@deza.com / Admin@Deza2026!");
        console.log("✅ Essentials updated successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
}

seedEssentials();
