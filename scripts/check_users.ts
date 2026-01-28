
import mongoose from 'mongoose';
import User from '../src/models/User';
import dotenv from 'dotenv';

dotenv.config();

const checkUsers = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in environment');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({}).select('email role gender womensHealth');
        console.log('--- USERS ---');
        users.forEach(u => {
            console.log(`Email: ${u.email}, Role: ${u.role}, Gender: ${u.gender}, WH: ${JSON.stringify(u.womensHealth ? 'Present' : 'Missing')}`);
        });
        console.log('----------------');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkUsers();
