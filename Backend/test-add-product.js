import mongoose from "mongoose";
import Category from "./models/Category.js";
import Brand from "./models/Brand.js";
import Product from "./models/Product.js";
import dotenv from "dotenv";
dotenv.config();

async function testAdd() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const cat = await Category.findOne({ name: "Men" });
        const brand = await Brand.findOne({ name: "DEZA" });

        const p = await Product.create({
            title: "Test Product " + Date.now(),
            description: "Test description",
            categories: ["Men"],
            types: ["DEZA"],
            sizePrices: [{ size: "100ml", price: 1500 }],
            stock: 10,
            mainImage: "https://example.com/img.jpg"
        });
        console.log("SUCCESS:", p._id);
        process.exit(0);
    } catch (err) {
        console.error("ERROR:", err);
        process.exit(1);
    }
}

testAdd();
