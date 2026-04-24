import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Subscriber from "./models/Subscriber.js";

dotenv.config();

async function seedNewsletterSubscribers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        // Fetch 20 random real users
        const users = await User.find({ role: "user" }).limit(20);

        if (users.length === 0) {
            console.log("No users found. Please seed users first.");
            process.exit(1);
        }

        let added = 0;
        let skipped = 0;

        for (const user of users) {
            try {
                await Subscriber.findOneAndUpdate(
                    { email: user.email },
                    {
                        email: user.email,
                        source: "Newsletter",
                        status: "Active",
                    },
                    { upsert: true, new: true }
                );
                console.log(`✅ Subscribed: ${user.name} (${user.email})`);
                added++;
            } catch (err) {
                console.log(`⚠️  Skipped ${user.email}: ${err.message}`);
                skipped++;
            }
        }

        console.log(`\n🎉 Done! ${added} users subscribed, ${skipped} skipped.`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}

seedNewsletterSubscribers();
