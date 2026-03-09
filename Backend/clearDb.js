import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const clearDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        const collections = await mongoose.connection.db.listCollections().toArray();

        for (const collection of collections) {
            await mongoose.connection.db.dropCollection(collection.name);
            console.log(`Dropped collection: ${collection.name}`);
        }

        console.log("Database cleared successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error clearing database:", error);
        process.exit(1);
    }
};

clearDatabase();
