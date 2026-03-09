import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

async function checkProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");
        const count = await Product.countDocuments();
        console.log(`Current product count: ${count}`);
        if (count > 0) {
            const products = await Product.find().limit(5);
            console.log("Sample products:");
            products.forEach(p => console.log(`- ${p.title} (${p._id})`));
        } else {
            console.log("❌ No products found in the 'products' collection.");
        }
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}

checkProducts();
