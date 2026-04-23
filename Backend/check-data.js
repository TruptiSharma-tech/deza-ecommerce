import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB.");
    const db = mongoose.connection.db;

    // Check archived products
    const Product = mongoose.model("Product", new mongoose.Schema({ title: String, isArchived: Boolean, isActive: Boolean }, { strict: false }));
    const archivedProducts = await Product.find({ isArchived: true });
    console.log(`Found ${archivedProducts.length} archived products.`);

    const Category = mongoose.model("Category", new mongoose.Schema({ name: String, active: Boolean }, { strict: false }));
    const inactiveCats = await Category.find({ active: false });
    console.log(`Found ${inactiveCats.length} inactive categories.`);

    const Brand = mongoose.model("Brand", new mongoose.Schema({ name: String, isActive: Boolean }, { strict: false }));
    const inactiveBrands = await Brand.find({ isActive: false });
    console.log(`Found ${inactiveBrands.length} inactive brands.`);
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
