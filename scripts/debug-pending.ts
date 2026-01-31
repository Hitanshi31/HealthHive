import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MedicalRecord from '../src/models/MedicalRecord';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        const pending = await MedicalRecord.find({ aiStatus: 'PENDING' });
        console.log("PENDING Records: " + pending.length);
        pending.forEach(r => {
            const age = (Date.now() - new Date(r.createdAt).getTime()) / 1000;
            console.log("- ID: " + r._id + ", Age: " + age.toFixed(1) + "s");
        });

        const failed = await MedicalRecord.countDocuments({ aiStatus: 'FAILED' });
        console.log("FAILED Records: " + failed);
    } catch (e) { console.error(e); }
    finally { await mongoose.disconnect(); process.exit(0); }
};
run();
