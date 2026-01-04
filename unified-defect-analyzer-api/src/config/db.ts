import mongoose from 'mongoose';

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.error('ERROR: MONGODB_URI environment variable is required');
        console.error('Please set MONGODB_URI in your .env file');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully to:', process.env.MONGODB_URI.split('@')[1]);
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};

export default connectDB;