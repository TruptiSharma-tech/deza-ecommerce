import mongoose from "mongoose";
import dotenv from "dotenv";
import AuditLog from "./models/AuditLog.js";
import User from "./models/User.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const admin = await User.findOne({ role: "admin" });
        if (!admin) {
            console.error("No admin found");
            process.exit(1);
        }
        const log = await AuditLog.create({
            adminId: admin._id,
            action: "Manual Test Log",
            module: "Debug",
            details: "Testing if logs can be created",
            ipAddress: "127.0.0.1"
        });
        console.log("TEST LOG CREATED:", log);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
