
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

async function checkProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        const count = await Product.countDocuments({});
        console.log("Total products in DB:", count);
        const products = await Product.find({}).limit(5);
        console.log("Sample products:", JSON.stringify(products, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkProducts();
