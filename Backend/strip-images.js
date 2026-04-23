import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./models/Order.js";

dotenv.config();

async function stripImagesFromOrders() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const orders = await Order.find({});
        let count = 0;
        for (const order of orders) {
            let modified = false;
            for (const item of order.items) {
                if (item.image && item.image.startsWith("data:image")) {
                    item.image = ""; // Remove heavy base64
                    modified = true;
                }
            }
            if (modified) {
                await order.save();
                count++;
            }
        }
        console.log(`Stripped images from ${count} orders to optimize response size.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

stripImagesFromOrders();
