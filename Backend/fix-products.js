import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

async function fixProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const result = await Product.updateMany({}, { isActive: true, isArchived: false });
        console.log(`Updated ${result.modifiedCount} products to be active and unarchived.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixProducts();
