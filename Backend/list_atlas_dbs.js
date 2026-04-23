import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function listAtlasDbs() {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        const admin = conn.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('ATLAS DATABASES:', JSON.stringify(dbs.databases, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }
}

listAtlasDbs();
