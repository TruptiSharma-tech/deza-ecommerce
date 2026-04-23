import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function listCollections() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('COLLECTIONS:', collections.map(c => c.name));
        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }
}

listCollections();
