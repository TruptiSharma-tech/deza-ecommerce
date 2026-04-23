import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

async function fixProductImages() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const products = await Product.find({});
        let count = 0;
        for (const p of products) {
            if (!p.mainImage && p.images && p.images.length > 0) {
                p.mainImage = p.images[0];
                await p.save();
                count++;
            }
        }
        console.log(`Fixed mainImage for ${count} products.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixProductImages();
