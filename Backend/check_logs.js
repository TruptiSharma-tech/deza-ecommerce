import mongoose from "mongoose";
import dotenv from "dotenv";
import AuditLog from "./models/AuditLog.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(5);
        console.log("RECENT AUDIT LOGS:", logs);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
