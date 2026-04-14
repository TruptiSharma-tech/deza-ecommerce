import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, default: "Mumbai" },
    pincode: { type: String },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Shop = mongoose.model("Shop", shopSchema);
export default Shop;
