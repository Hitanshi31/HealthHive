import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MedicalRecord from '../src/models/MedicalRecord';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Checking last 5 records...");
        const records = await MedicalRecord.find().sort({ createdAt: -1 }).limit(5);

        records.forEach(r => {
            console.log("---");
            console.log("ID:", r._id);
            console.log("Type:", r.type);
            console.log("Created:", r.createdAt);
            console.log("aiStatus:", r.aiStatus || "MISSING");
            console.log("aiSummary (length):", r.aiSummary ? r.aiSummary.length : 0);
            console.log("Summary snippet:", r.aiSummary ? r.aiSummary.substring(0, 50) + "..." : "NONE");
        });
    } catch (e) { console.error(e); }
    finally { await mongoose.disconnect(); process.exit(0); }
};
run();
