import mongoose from 'mongoose';

async function checkNakshi() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/nakshi');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('COLLECTIONS:', collections.map(c => c.name));
        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }
}

checkNakshi();
