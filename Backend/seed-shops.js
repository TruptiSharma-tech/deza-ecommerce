import mongoose from "mongoose";
import dotenv from "dotenv";
import Shop from "./models/Shop.js";

dotenv.config();

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    
    await Shop.deleteMany({}); // Start fresh

    const shops = [
        {
            name: "DEZA Luxury - Mulund West",
            address: "Nirmal Lifestyle, LBS Marg",
            city: "Mumbai",
            pincode: "400080",
            location: { lat: 19.1726, lng: 72.9425 },
            isPrimary: true
        },
        {
            name: "DEZA Luxury - Bandra West",
            address: "Linking Road",
            city: "Mumbai",
            pincode: "400050",
            location: { lat: 19.0596, lng: 72.8295 }
        },
        {
            name: "DEZA Luxury - Thane",
            address: "Viviana Mall",
            city: "Thane",
            pincode: "400606",
            location: { lat: 19.2183, lng: 72.9781 }
        }
    ];

    await Shop.insertMany(shops);
    console.log("3 Shops seeded successfully!");
    process.exit(0);
}

seed();
