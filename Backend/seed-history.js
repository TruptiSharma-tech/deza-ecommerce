import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import User from "./models/User.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import Review from "./models/Review.js";
import SupportTicket from "./models/SupportTicket.js";
import Shop from "./models/Shop.js";

dotenv.config();

const NAMES = [
    "Arjun Mehta", "Siddharth Rao", "Priya Kulkarni", "Neha Deshmukh", "Anjali Nair",
    "Vikram Singh", "Rahul Khanna", "Ishaan Malhotra", "Sana Sheikh", "Ayesha Khan",
    "Rohan Gupta", "Karan Johar", "Aditi Rao", "Deepika Padukone", "Ranveer Singh",
    "Amitabh Bachchan", "Shah Rukh Khan", "Salman Khan", "Hrithik Roshan", "Varun Dhawan",
    "Alia Bhatt", "Kriti Sanon", "Shraddha Kapoor", "Kiara Advani", "Sara Ali Khan",
    "Manish Malhotra", "Sabyasachi Mukherjee", "Tarun Tahiliani", "Anita Dongre", "Ritu Kumar"
];

const CITIES = ["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad", "Chennai", "Ahmedabad", "Jaipur", "Surat", "Lucknow"];

const QUERIES = [
    "The Deza Polar Lily fragrance is absolutely stunning, but I noticed it doesn't last as long as expected. Any tips?",
    "Can I get express delivery to Mumbai? I need this for a birthday tomorrow.",
    "Do you offer customized gift packaging? I want to send this to a friend.",
    "My order hasn't been shipped yet. It's been 3 days. Please check.",
    "The packaging was slightly torn when it arrived, though the perfume is safe.",
    "Is the Deza Amethyst scent unisex or specifically for women?",
    "I'm looking for a woody fragrance for office wear. What do you recommend?",
    "Can I change my delivery address? I accidentally entered the wrong flat number."
];

const REVIEWS_TEXT = [
    { text: "Absolutely love the fragrance. Lasts all day long!", rating: 5 },
    { text: "Good smell, but I wish the bottle design was better.", rating: 4 },
    { text: "A bit too strong for my taste, but good quality.", rating: 3 },
    { text: "Perfect for evening parties. Received many compliments.", rating: 5 },
    { text: "Smooth delivery and great packaging. Highly recommended.", rating: 5 },
    { text: "Decent product for the price point. Could be better.", rating: 4 },
    { text: "My go-to luxury brand now. Extremely satisfied with the purchase.", rating: 5 },
    { text: "Smells divine! Worth every penny.", rating: 5 }
];

async function seedRealData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Real Seeding.");

        const products = await Product.find({});
        if (products.length === 0) {
            console.log("No products found. Please seed products first.");
            process.exit(1);
        }

        const hashedPw = await bcrypt.hash("User@1234", 12);

        // 1. CLEAR OLD DATA (except products/shops)
        await User.deleteMany({ role: "user" });
        await Order.deleteMany({});
        await SupportTicket.deleteMany({});
        await Review.deleteMany({});

        // 2. CREATE REAL USERS (Phone format: +91 XXXXXXXXXX)
        console.log("👤 Creating 50+ Real Indian Users...");
        const users = [];
        const primaryUsers = [
            { name: "Trupti Sharma", email: "trupti.sharma@deza.in", phone: "+91 9820012345" },
            { name: "Gayatri Sharma", email: "gayatri.sharma@deza.in", phone: "+91 9820012346" },
            { name: "Ronit Nishad", email: "ronit.nishad@deza.in", phone: "+91 9820012347" },
            { name: "Dishant Jadhav", email: "dishant.jadhav@deza.in", phone: "+91 9820012348" },
            { name: "Tanu Verma", email: "tanu.verma@deza.in", phone: "+91 9820012349" }
        ];

        const userStartDate = new Date("2026-03-20");
        const userEndDate = new Date("2026-04-01");

        for (const u of primaryUsers) {
            const createdAt = new Date(userStartDate.getTime() + Math.random() * (userEndDate.getTime() - userStartDate.getTime()));
            const user = await User.create({
                name: u.name, email: u.email, password: hashedPw, contact: u.phone, role: "user", verifiedAt: new Date(), createdAt
            });
            users.push(user);
        }

        for (let i = 0; i < 45; i++) {
            const firstName = NAMES[Math.floor(Math.random() * NAMES.length)].split(' ')[0];
            const lastName = NAMES[Math.floor(Math.random() * NAMES.length)].split(' ')[1];
            const name = `${firstName} ${lastName}`;
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random()*100)}@gmail.com`;
            
            const firstDigit = [9, 8, 7, 6][Math.floor(Math.random() * 4)];
            const restDigits = Math.floor(100000000 + Math.random() * 900000000);
            const contact = `+91 ${firstDigit}${restDigits}`;
            
            const createdAt = new Date(userStartDate.getTime() + Math.random() * (userEndDate.getTime() - userStartDate.getTime()));
            const user = await User.create({
                name, email, password: hashedPw, contact, role: "user", verifiedAt: new Date(), createdAt
            });
            users.push(user);
        }

        // 3. CREATE EXACTLY 50 ORDERS (Ensuring every product is ordered at least once)
        console.log("🛒 Creating Exactly 50 Real Orders...");
        const startDate = new Date("2026-03-20");
        const endDate = new Date("2026-04-23");

        for (let i = 0; i < 50; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const items = [];
            let total = 0;

            // Ensure first `products.length` orders contain unique products to cover all
            let prod;
            if (i < products.length) {
                prod = products[i];
            } else {
                prod = products[Math.floor(Math.random() * products.length)];
            }

            const qty = Math.floor(Math.random() * 2) + 1;
            const price = prod.price || 1499;
            items.push({ id: prod._id, name: prod.title, price, qty, image: prod.mainImage || prod.image });
            total += price * qty;

            const createdAt = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
            const status = Math.random() > 0.3 ? "Delivered" : (Math.random() > 0.5 ? "Shipped" : "Processing");
            const paymentMethod = ["UPI", "COD", "Card", "Netbanking"][Math.floor(Math.random() * 4)];

            await Order.create({
                orderNumber: `DZ-${Math.floor(100000 + Math.random() * 900000)}`,
                customerId: user._id, customerName: user.name, customerEmail: user.email, customerPhone: user.phone,
                items, totalAmount: total, totalPrice: total,
                shippingAddress: {
                    street: `${Math.floor(Math.random()*500)} Park Avenue`,
                    city: CITIES[Math.floor(Math.random() * CITIES.length)],
                    state: "Maharashtra", pincode: "4000" + Math.floor(10 + Math.random() * 80), country: "India"
                },
                paymentMethod,
                paymentStatus: status === "Delivered" ? "Paid" : (Math.random() > 0.2 ? "Paid" : "Pending"),
                status, orderStatus: status,
                orderSource: Math.random() > 0.7 ? "WhatsApp" : "Website",
                createdAt
            });
        }

        // 4. CREATE REAL SUPPORT TICKETS (Solved > Pending)
        console.log("💬 Creating Real Support Tickets...");
        for (let i = 0; i < 12; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const status = i < 9 ? "Resolved" : "Pending"; // 9 resolved, 3 pending
            const priority = ["High", "Medium", "Low"][Math.floor(Math.random() * 3)];
            
            await SupportTicket.create({
                userId: user._id, name: user.name, email: user.email,
                subject: QUERIES[Math.floor(Math.random() * QUERIES.length)].slice(0, 30) + "...",
                message: QUERIES[Math.floor(Math.random() * QUERIES.length)],
                status, resolved: status === "Resolved", priority,
                createdAt: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()))
            });
        }

        // 5. CREATE REAL REVIEWS
        console.log("⭐ Creating Real Reviews...");
        // Ensure some reviews so that the Highest Rated Product logic works
        for (let i = 0; i < products.length * 2; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const prod = products[Math.floor(Math.random() * products.length)];
            const r = REVIEWS_TEXT[Math.floor(Math.random() * REVIEWS_TEXT.length)];
            
            await Review.create({
                productId: prod._id,
                userId: user._id,
                userName: user.name,
                rating: r.rating,
                comment: r.text,
                createdAt: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()))
            });
        }

        console.log("✨ Seeding complete! 50 exact orders, 50 users with +91 phones, all products ordered, reviews and meaningful support queries added.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
}

seedRealData();
