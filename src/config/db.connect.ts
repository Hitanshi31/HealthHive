import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB Connection Failed:', error);
        process.exit(1);
    }
};

export default connectDB;
