
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import MedicalRecord from '../src/models/MedicalRecord';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const verify = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error("No Mongo URI");
        await mongoose.connect(process.env.MONGODB_URI);

        const brokenCount = await MedicalRecord.countDocuments({
            type: { $ne: 'PRESCRIPTION' },
            $or: [
                { aiSummary: { $regex: /MOCK AI/ } },
                { aiSummary: { $exists: false } },
                { aiSummary: "" }
            ]
        });

        if (brokenCount === 0) {
            console.log("✅ VERIFIED: All records have valid AI summaries.");
        } else {
            console.log(`❌ FAILED: ${brokenCount} records still have mock/missing summaries.`);
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
};

verify();
