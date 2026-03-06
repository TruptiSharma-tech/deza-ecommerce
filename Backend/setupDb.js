import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import User from "./models/User.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import Query from "./models/Query.js";
import Review from "./models/Review.js";

dotenv.config();

async function setup() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Drop exactly what's currently there to clear data securely
    await mongoose.connection.db.dropDatabase();
    console.log("Database totally wiped.");

    // 1. Explicitly create collections from schema so they exist in GUI
    await User.createCollection();
    console.log("Created users collection.");

    await Product.createCollection();
    console.log("Created products collection.");

    await Order.createCollection();
    console.log("Created orders collection.");

    await Query.createCollection();
    console.log("Created queries collection.");

    await Review.createCollection();
    console.log("Created reviews collection.");

    // 2. Re-create the single master admin
    const h1 = await bcrypt.hash("Admin@Deza2026!", 10);
    await User.create({
        name: "DEZA Admin",
        email: "admin@deza.com",
        password: h1,
        role: "admin",
        verifiedAt: new Date().toISOString(),
    });

    console.log("Created 1 master admin so login works. Everything else is EMPTY.");
    process.exit(0);
}

setup().catch(console.error);
