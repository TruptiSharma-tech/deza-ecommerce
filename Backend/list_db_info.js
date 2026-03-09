import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function listAll() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected");
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (let c of collections) {
            const count = await mongoose.connection.db.collection(c.name).countDocuments();
            console.log(`- ${c.name}: ${count}`);
        }
        process.exit(0);
    } catch (err) {
        console.error("❌", err);
        process.exit(1);
    }
}
listAll();
