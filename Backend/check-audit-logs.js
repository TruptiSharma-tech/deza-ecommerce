
import mongoose from "mongoose";
import dotenv from "dotenv";
import AuditLog from "./models/AuditLog.js";

dotenv.config();

async function checkAuditLogs() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(20);
        console.log("AUDIT_LOGS:" + JSON.stringify(logs, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkAuditLogs();
