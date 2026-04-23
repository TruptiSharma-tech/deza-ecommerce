import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import User from "./models/User.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import Category from "./models/Category.js";
import Brand from "./models/Brand.js";
import Shop from "./models/Shop.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function restoreToday() {
    try {
        console.log("🚀 Starting restoration of today's work...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB.");

        // 1. Ensure Categories & Brands exist
        const catsToCreate = [
            { name: "Luxury Perfumes", isFeatured: true },
            { name: "Floral Scents", isFeatured: true }
        ];
        const catIds = {};
        for (const c of catsToCreate) {
            let cat = await Category.findOne({ name: c.name });
            if (!cat) {
                cat = new Category(c);
                await cat.save();
            }
            catIds[c.name] = cat._id;
        }

        const brands = ["Deza", "Dior", "Gucci", "Chanel", "Tom Ford", "Burberry", "Prada", "Lacoste", "Kayali", "Parfums de Marly"];
        const brandIds = {};
        for (const b of brands) {
            let brand = await Brand.findOne({ name: b });
            if (!brand) {
                brand = new Brand({ name: b, isFeatured: true });
                await brand.save();
            }
            brandIds[b] = brand._id;
        }

        const mainShop = await Shop.findOne({ isPrimary: true }) || await Shop.create({
            name: "DEZA Flagship Store",
            address: "Phoenix Marketcity, Kurla",
            city: "Mumbai",
            pincode: "400070",
            location: { lat: 19.0863, lng: 72.8890 },
            isPrimary: true
        });

        // 2. Restore Products added today (Found in Audit Logs)
        console.log("📦 Re-creating today's 20+ products...");
        const todayProducts = [
            { title: "Deza Petal Blush", brand: "Deza", category: catIds["Floral Scents"], price: 1899, img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=500" },
            { title: "Deza Aurora Bergamot", brand: "Deza", category: catIds["Luxury Perfumes"], price: 2199, img: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=500" },
            { title: "Deza Ocean Driftwood Eau De Parfum (EDP)", brand: "Deza", category: catIds["Luxury Perfumes"], price: 2499, img: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=500" },
            { title: "Dior Sauvage Eau De Parfum (EDP)", brand: "Dior", category: catIds["Luxury Perfumes"], price: 9500, img: "https://images.unsplash.com/photo-1585232351009-aa87416fca90?q=80&w=500" },
            { title: "Gucci Flora Gorgeous Jasmine Eau De Parfum (EDP)", brand: "Gucci", category: catIds["Floral Scents"], price: 8900, img: "https://images.unsplash.com/photo-1601931935821-5fbe71157695?q=80&w=500" },
            { title: "Victoria's Secret Bombshell Eau De Parfum (EDP)", brand: "Deza", category: catIds["Floral Scents"], price: 6500, img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=500" },
            { title: "Chanel Chance Eau Tendre Eau De Parfum (EDP)", brand: "Chanel", category: catIds["Floral Scents"], price: 10500, img: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=500" },
            { title: "Lacoste L.12.12 White Eau De Parfum (EDP)", brand: "Lacoste", category: catIds["Luxury Perfumes"], price: 4500, img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=500" },
            { title: "Stronger With You Intensely Eau De Parfum (EDP)", brand: "Deza", category: catIds["Luxury Perfumes"], price: 7200, img: "https://images.unsplash.com/photo-1585232351009-aa87416fca90?q=80&w=500" },
            { title: "Tom Ford Noir Eau De Parfum (EDP)", brand: "Tom Ford", category: catIds["Luxury Perfumes"], price: 12500, img: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=500" },
            { title: "My Burberry Blush Eau De Parfum (EDP)", brand: "Burberry", category: catIds["Floral Scents"], price: 7800, img: "https://images.unsplash.com/photo-1601931935821-5fbe71157695?q=80&w=500" },
            { title: "Kayali Lovefest Burning Cherry | 48 Eau De Parfum (EDP)", brand: "Kayali", category: catIds["Floral Scents"], price: 8500, img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=500" },
            { title: "Parfums de Marly Layton Eau De Parfum (EDP)", brand: "Parfums de Marly", category: catIds["Luxury Perfumes"], price: 18500, img: "https://images.unsplash.com/photo-1585232351009-aa87416fca90?q=80&w=500" },
            { title: "Prada Paradoxe Eau De Parfum (EDP)", brand: "Prada", category: catIds["Floral Scents"], price: 9200, img: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=500" },
            { title: "RiRi by Deza Eau De Parfum (EDP)", brand: "Deza", category: catIds["Luxury Perfumes"], price: 3200, img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=500" }
        ];

        const createdProducts = [];
        for (const p of todayProducts) {
            const product = await Product.create({
                title: p.title,
                brand: brandIds[p.brand],
                category: p.category,
                sizePrices: [{ size: "100ml", price: p.price }],
                mainImage: p.img,
                stock: 100,
                isFeatured: true
            });
            createdProducts.push(product);
        }

        // 3. Restore Today's 4 Users (Placeholders)
        console.log("👥 Re-creating today's 4 test users...");
        const hashedPw = await bcrypt.hash("User@1234", 10);
        const users = [];
        for (let i = 1; i <= 4; i++) {
            const user = await User.create({
                name: `Test User ${i}`,
                email: `testuser${i}@example.com`,
                password: hashedPw,
                verifiedAt: new Date()
            });
            users.push(user);
        }

        // 4. Restore Today's 3 Orders (Placeholders from Audit Log IDs)
        console.log("🛒 Re-creating today's 3 orders...");
        const orderIds = ["DZ-56EBKKPHJ4", "DZ-ACQS8IW4AF", "DZ-YGJUHDTGIM"];
        const statuses = ["Delivered", "Shipped", "Packed"];
        for (let i = 0; i < 3; i++) {
            await Order.create({
                orderNumber: orderIds[i],
                customerId: users[i]._id,
                customerName: users[i].name,
                shopId: mainShop._id,
                items: [{
                    id: createdProducts[i]._id,
                    name: createdProducts[i].title,
                    image: createdProducts[i].mainImage,
                    selectedSize: "100ml",
                    price: todayProducts[i].price,
                    qty: 1
                }],
                shippingAddress: { street: "Test Street", city: "Mumbai", state: "Maharashtra", pincode: "400001", country: "India" },
                totalAmount: todayProducts[i].price,
                paymentMethod: "UPI",
                paymentStatus: "Paid",
                orderStatus: statuses[i]
            });
        }

        console.log("\n✨ Today's work restored successfully!");
        console.log("Restored Products: " + createdProducts.length);
        console.log("Restored Users:    " + users.length);
        console.log("Restored Orders:   " + orderIds.length);
        process.exit(0);
    } catch (err) {
        console.error("❌ Restoration failed:", err);
        process.exit(1);
    }
}

restoreToday();
