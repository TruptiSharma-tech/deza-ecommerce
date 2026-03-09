import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function checkCollections() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        for (let col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count} documents`);
            if (col.name === "products" && count > 0) {
                const sample = await db.collection(col.name).findOne();
                console.log("Sample product format:", JSON.stringify(sample, null, 2));
            }
        }
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}

checkCollections();
