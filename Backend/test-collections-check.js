
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function checkCollections() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("COLLECTIONS:" + JSON.stringify(collections.map(c => c.name), null, 2));

        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments({});
            console.log(`Collection ${col.name}: ${count} documents`);
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkCollections();
