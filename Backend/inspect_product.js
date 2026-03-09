import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const products = await Product.find();
        console.log("Found", products.length, "products.");
        if (products.length > 0) {
            console.log("Full JSON of first product:");
            console.log(JSON.stringify(products[0], null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
inspect();
