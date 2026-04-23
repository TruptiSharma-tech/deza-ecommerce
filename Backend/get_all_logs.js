import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AuditLog from "./models/AuditLog.js";
dotenv.config();

async function getAllLogs() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const logs = await AuditLog.find({}).sort({ createdAt: -1 });
        console.log('ALL_LOGS:' + JSON.stringify(logs, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }
}

getAllLogs();
