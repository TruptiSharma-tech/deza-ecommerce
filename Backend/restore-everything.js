import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import User from "./models/User.js";
import Admin from "./models/Admin.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import Category from "./models/Category.js";
import Brand from "./models/Brand.js";
import Shop from "./models/Shop.js";
import Review from "./models/Review.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const ADMIN_EMAIL = "admin@deza.com";
const ADMIN_PASSWORD = "Admin@Deza2026!";

async function restore() {
    try {
        console.log("🚀 Starting database restoration...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB.");

        // Clear existing data to avoid duplicates
        console.log("🧹 Clearing existing collections...");
        await Promise.all([
            User.deleteMany({}),
            Admin.deleteMany({}),
            Product.deleteMany({}),
            Order.deleteMany({}),
            Category.deleteMany({}),
            Brand.deleteMany({}),
            Shop.deleteMany({}),
            Review.deleteMany({})
        ]);

        const hashedPw = await bcrypt.hash(ADMIN_PASSWORD, 10);

        // 1. Create Admins
        console.log("👥 Seeding Admins...");
        const adminUser = await User.create({
            name: "DEZA Admin",
            email: ADMIN_EMAIL,
            password: hashedPw,
            role: "admin",
            verifiedAt: new Date()
        });

        await Admin.create({
            name: "DEZA Super Admin",
            email: ADMIN_EMAIL,
            password: hashedPw,
            role: "superadmin",
            permissions: ["all"]
        });

        // 2. Create Regular Users
        const user1 = await User.create({
            name: "John Doe",
            email: "john@example.com",
            password: hashedPw,
            contact: "9876543210",
            verifiedAt: new Date(),
            addresses: [{
                street: "123 Luxury Lane",
                area: "Bandra",
                city: "Mumbai",
                state: "Maharashtra",
                pincode: "400050",
                country: "India",
                isDefault: true
            }]
        });

        const user2 = await User.create({
            name: "Jane Smith",
            email: "jane@example.com",
            password: hashedPw,
            contact: "9123456789",
            verifiedAt: new Date()
        });

        // 3. Create Categories
        console.log("📂 Seeding Categories...");
        const luxuryCat = await Category.create({
            name: "Luxury Perfumes",
            description: "High-end artisanal fragrances",
            isFeatured: true
        });

        const casualCat = await Category.create({
            name: "Casual Wear",
            description: "Everyday fresh scents",
            isFeatured: false
        });

        // 4. Create Brands
        console.log("🏷️ Seeding Brands...");
        const dezaBrand = await Brand.create({
            name: "DEZA",
            description: "Luxury Fragrance House",
            isFeatured: true
        });

        // 5. Create Shops
        console.log("🏪 Seeding Shops...");
        const mainShop = await Shop.create({
            name: "DEZA Flagship Store",
            address: "Phoenix Marketcity, Kurla",
            city: "Mumbai",
            pincode: "400070",
            location: { lat: 19.0863, lng: 72.8890 },
            isPrimary: true
        });

        // 6. Create Products
        console.log("📦 Seeding Products...");
        const productsData = [
            {
                title: "DEZA Noir",
                description: "A bold, magnetic fragrance with deep notes of oud and leather.",
                fragrance: "Oud, Leather, Amber",
                category: luxuryCat._id,
                brand: dezaBrand._id,
                sizePrices: [{ size: "50ml", price: 1799 }, { size: "100ml", price: 2999 }],
                stock: 50,
                sold: 120,
                mainImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=500",
                isFeatured: true,
                rating: 4.8
            },
            {
                title: "DEZA Blossom",
                description: "Soft floral luxury with notes of jasmine and rose.",
                fragrance: "Jasmine, Rose, Peony",
                category: luxuryCat._id,
                brand: dezaBrand._id,
                sizePrices: [{ size: "50ml", price: 1499 }, { size: "100ml", price: 2499 }],
                stock: 40,
                sold: 98,
                mainImage: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=500",
                isFeatured: true,
                rating: 4.7
            },
            {
                title: "DEZA Fresh Azure",
                description: "A crisp aquatic fragrance for everyday wear.",
                fragrance: "Sea Breeze, Lime, Vetiver",
                category: casualCat._id,
                brand: dezaBrand._id,
                sizePrices: [{ size: "50ml", price: 1199 }, { size: "100ml", price: 1999 }],
                stock: 60,
                sold: 55,
                mainImage: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=500",
                rating: 4.5
            }
        ];

        const createdProducts = [];
        for (const p of productsData) {
            const product = new Product(p);
            await product.save();
            createdProducts.push(product);
        }

        // 7. Create Orders (to populate sales)
        console.log("🛒 Seeding Orders...");
        const ordersData = [
            {
                orderNumber: "ORD-" + Date.now() + "-1",
                customerId: user1._id,
                customerName: user1.name,
                customerEmail: user1.email,
                customerPhone: user1.contact,
                shopId: mainShop._id,
                items: [{
                    id: createdProducts[0]._id,
                    name: createdProducts[0].title,
                    image: createdProducts[0].mainImage,
                    selectedSize: "100ml",
                    price: 2999,
                    qty: 1
                }],
                shippingAddress: user1.addresses[0],
                totalAmount: 2999,
                paymentMethod: "UPI",
                paymentStatus: "Paid",
                orderStatus: "Delivered",
                deliveredAt: new Date(Date.now() - 86400000 * 2) // 2 days ago
            },
            {
                orderNumber: "ORD-" + Date.now() + "-2",
                customerId: user2._id,
                customerName: user2.name,
                customerEmail: user2.email,
                customerPhone: user2.contact,
                shopId: mainShop._id,
                items: [{
                    id: createdProducts[1]._id,
                    name: createdProducts[1].title,
                    image: createdProducts[1].mainImage,
                    selectedSize: "50ml",
                    price: 1499,
                    qty: 2
                }],
                shippingAddress: {
                    street: "456 Ocean View",
                    area: "Juhu",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pincode: "400049",
                    country: "India"
                },
                totalAmount: 2998,
                paymentMethod: "Card",
                paymentStatus: "Paid",
                orderStatus: "Shipped"
            },
            {
                orderNumber: "ORD-" + Date.now() + "-3",
                customerId: user1._id,
                customerName: user1.name,
                customerEmail: user1.email,
                customerPhone: user1.contact,
                shopId: mainShop._id,
                items: [{
                    id: createdProducts[2]._id,
                    name: createdProducts[2].title,
                    image: createdProducts[2].mainImage,
                    selectedSize: "100ml",
                    price: 1999,
                    qty: 1
                }],
                shippingAddress: user1.addresses[0],
                totalAmount: 1999,
                paymentMethod: "UPI",
                paymentStatus: "Paid",
                orderStatus: "Processing"
            }
        ];

        await Order.insertMany(ordersData);

        console.log("\n✨ Restoration Complete!");
        console.log("--------------------------");
        console.log("Admin Email:    " + ADMIN_EMAIL);
        console.log("Admin Password: " + ADMIN_PASSWORD);
        console.log("Sample User:    john@example.com / " + ADMIN_PASSWORD);
        console.log("Seeded Products: " + createdProducts.length);
        console.log("Seeded Orders:   " + ordersData.length);
        console.log("--------------------------\n");

        process.exit(0);
    } catch (err) {
        console.error("❌ Restoration failed:", err);
        process.exit(1);
    }
}

restore();
