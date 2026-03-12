
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function checkDatabases() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log("DATABASES:" + JSON.stringify(dbs, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkDatabases();
