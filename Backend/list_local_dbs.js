import mongoose from 'mongoose';

async function listDbs() {
    try {
        const conn = await mongoose.connect('mongodb://127.0.0.1:27017');
        const admin = conn.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('DATABASES:', JSON.stringify(dbs.databases, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }
}

listDbs();
