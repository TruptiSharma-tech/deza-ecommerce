import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function checkAllDbs() {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        const admin = conn.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log("Databases in cluster:");
        for (let db of dbs.databases) {
            console.log(`- ${db.name}`);
        }
        process.exit(0);
    } catch (err) {
        console.error("❌", err);
        process.exit(1);
    }
}
checkAllDbs();
