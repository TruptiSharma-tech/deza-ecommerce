import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../Backend/.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/deza";

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        const Product = mongoose.model('Product', new mongoose.Schema({ title: String, slug: String }));
        const products = await Product.find({}).limit(5);
        console.log("DATABASE CHECK:");
        products.forEach(p => {
            console.log(`- Title: ${p.title} | ID: ${p._id} | Slug: ${p.slug}`);
        });
        process.exit(0);
    } catch (err) {
        console.error("DB CHECK FAILED:", err);
        process.exit(1);
    }
}

check();
