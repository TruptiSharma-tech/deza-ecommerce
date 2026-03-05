import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./Backend/.env" });

async function check() {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected");
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        if (collections.length === 0) {
            console.log("❌ No collections found in this database!");
        }

        for (let c of collections) {
            const count = await db.collection(c.name).countDocuments();
            console.log(`${c.name}: ${count} documents`);
        }
        process.exit(0);
    } catch (e) {
        console.error("❌ Error:", e.message);
        process.exit(1);
    }
}
check();
