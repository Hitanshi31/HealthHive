import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MedicalRecord from '../src/models/MedicalRecord';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);

        // Find records that have a summary but are stuck in PENDING
        const stuck = await MedicalRecord.find({
            aiStatus: 'PENDING',
            aiSummary: { $exists: true, $ne: '' }
        });

        console.log(`Found ${stuck.length} records that had summaries but were stuck in PENDING.`);

        for (const r of stuck) {
            r.aiStatus = 'COMPLETED';
            await r.save();
            console.log(`Transitioned record ${r._id} to COMPLETED.`);
        }

        console.log("Cleanup finished.");

    } catch (e) {
        console.error("CLEANUP FAILED:", e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
