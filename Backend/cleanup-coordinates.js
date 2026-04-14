import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./models/Order.js";

dotenv.config();

async function cleanup() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB...");
    
    // Mulund West, Mumbai Coordinates
    const targetLat = 19.1726;
    const targetLng = 72.9425;

    // Update all orders that are currently in Delhi (or just all orders for safety)
    const result = await Order.updateMany(
        {}, 
        { 
            $set: { 
                "liveTracking.lat": targetLat, 
                "liveTracking.lng": targetLng 
            } 
        }
    );

    console.log(`Updated ${result.modifiedCount} orders to Mulund, Mumbai.`);
    process.exit(0);
}

cleanup();
