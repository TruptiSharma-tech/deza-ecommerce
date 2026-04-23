import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "./models/User.js";
import Order from "./models/Order.js";
import Review from "./models/Review.js";
import SupportTicket from "./models/SupportTicket.js";

dotenv.config();

async function redistributeTimeline() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const startDate = new Date("2026-03-20");
        const endDate = new Date(); // April 23

        const getRandomDate = () => new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));

        // 1. Redistribute Users
        console.log("📅 Updating Users timeline...");
        const users = await User.find({ role: "user" });
        for (const user of users) {
            const date = getRandomDate();
            user.createdAt = date;
            user.updatedAt = date;
            await user.save();
        }

        // 2. Redistribute Orders
        console.log("📅 Updating Orders timeline...");
        const orders = await Order.find({});
        for (const order of orders) {
            const date = getRandomDate();
            order.createdAt = date;
            order.updatedAt = date;
            await order.save();
        }

        // 3. Redistribute Reviews
        console.log("📅 Updating Reviews timeline...");
        const reviews = await Review.find({});
        for (const review of reviews) {
            const date = getRandomDate();
            review.createdAt = date;
            review.updatedAt = date;
            await review.save();
        }

        // 4. Redistribute Queries
        console.log("📅 Updating Support Queries timeline...");
        const tickets = await SupportTicket.find({});
        for (const ticket of tickets) {
            const date = getRandomDate();
            ticket.createdAt = date;
            ticket.updatedAt = date;
            await ticket.save();
        }

        console.log("✅ Timeline redistribution complete! All data now spans March 20 - April 23.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

redistributeTimeline();
