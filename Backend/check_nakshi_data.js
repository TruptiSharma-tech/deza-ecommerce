import mongoose from 'mongoose';

async function checkNakshiData() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/nakshi');
        const Product = mongoose.model('Product', new mongoose.Schema({ title: String, name: String }, { strict: false }), 'products');
        const products = await Product.find({}).limit(5);
        console.log('NAKSHI PRODUCTS:', JSON.stringify(products, null, 2));
        
        const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');
        const orderCount = await Order.countDocuments();
        console.log('NAKSHI ORDER COUNT:', orderCount);
        
        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }
}

checkNakshiData();
