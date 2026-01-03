// Test MongoDB Atlas connection
import { config } from 'dotenv';
config();

import mongoose from 'mongoose';

const testConnection = async () => {
    try {
        console.log('Testing MongoDB connection...');
        console.log('URI:', process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@')); // Hide password
        
        await mongoose.connect(process.env.MONGODB_URI || '');
        
        console.log('✅ MongoDB connected successfully!');
        console.log('Database:', mongoose.connection.db.databaseName);
        
        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        
        await mongoose.connection.close();
        console.log('✅ Connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};

testConnection();
