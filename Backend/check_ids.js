import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

async function checkIds() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const products = await Product.find();
        console.log("Products found:", products.length);
        products.forEach(p => {
            console.log(`ID: "${p._id}", Type: ${typeof p._id}, isObjectId: ${p._id instanceof mongoose.Types.ObjectId}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkIds();
