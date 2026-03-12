
import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./models/Order.js";

dotenv.config();

async function testOrderCreation() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const testOrder = {
            orderNumber: "TEST-" + Date.now(),
            customerName: "Test User",
            customerEmail: "test@example.com",
            customerPhone: "1234567890",
            items: [{
                name: "Test Item",
                price: 100,
                qty: 1
            }],
            shippingAddress: { street: "123 Test St", city: "Test City" },
            totalAmount: 100,
            paymentMethod: "Cash On Delivery",
            paymentStatus: "Pending",
            orderStatus: "Processing"
        };

        const newOrder = await Order.create(testOrder);
        console.log("SUCCESS: Order created with ID:", newOrder._id);

        // Clean up
        await Order.findByIdAndDelete(newOrder._id);
        console.log("Cleaned up test order");

        process.exit(0);
    } catch (err) {
        console.error("CREATE_ERROR:", err);
        process.exit(1);
    }
}

testOrderCreation();
