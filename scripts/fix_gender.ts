
import mongoose from 'mongoose';
import User from '../src/models/User';
import dotenv from 'dotenv';

dotenv.config();

const fixGender = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in environment');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update specific test users to Female
        const res = await User.updateMany(
            { email: { $in: ['patient@test.com', 'patient3@gmail.com'] } },
            { $set: { gender: 'Female' } }
        );

        console.log(`Updated ${res.modifiedCount} users to Female.`);

        // Log final state
        const users = await User.find({ email: { $in: ['patient@test.com', 'patient3@gmail.com'] } }).select('email gender');
        console.log(users);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

fixGender();
