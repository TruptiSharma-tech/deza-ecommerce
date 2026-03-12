
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

async function checkProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await Product.countDocuments({});
        console.log("TOTAL_COUNT:" + count);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkProducts();
