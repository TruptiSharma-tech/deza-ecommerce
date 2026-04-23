import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AuditLog from "./models/AuditLog.js";
dotenv.config();

async function checkOldLogs() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await AuditLog.countDocuments();
        console.log('TOTAL LOGS:', count);
        
        const oldLogs = await AuditLog.find({
            createdAt: { $lt: new Date('2026-04-23T00:00:00Z') }
        }).limit(10);
        
        console.log('OLD LOGS:', JSON.stringify(oldLogs, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }
}

checkOldLogs();
