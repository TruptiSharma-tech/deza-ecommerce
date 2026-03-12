
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function checkIndexes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const collection = mongoose.connection.db.collection("orders");
        const indexes = await collection.indexes();
        console.log("INDEXES:" + JSON.stringify(indexes, null, 2));

        // Try to drop the offending unique index
        try {
            await collection.dropIndex("orderId_1");
            console.log("Dropped index: orderId_1");
        } catch (e) {
            console.log("Failed to drop index: " + e.message);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkIndexes();
