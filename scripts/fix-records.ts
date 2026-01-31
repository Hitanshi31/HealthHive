
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import MedicalRecord from '../src/models/MedicalRecord';
import aiService from '../src/services/ai.service';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const fixRecall = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error("No Mongo URI");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        // Find ALL records with Mock AI summary or missing summary
        // And is NOT a prescription (prescriptions use deterministic AI which always works)
        const records = await MedicalRecord.find({
            type: { $ne: 'PRESCRIPTION' },
            $or: [
                { aiSummary: { $regex: /MOCK AI/ } },
                { aiSummary: { $exists: false } },
                { aiSummary: "" }
            ]
        }).sort({ createdAt: -1 });

        if (records.length === 0) {
            console.log("✅ No broken records found! All recent non-prescription records seem to have valid AI summaries.");
        } else {
            console.log(`⚠️  Found ${records.length} records to fix.`);

            for (const record of records) {
                console.log(`\nProcessing ID: ${record._id} (${record.type})`);
                try {
                    await aiService.processRecord(record._id.toString());
                    console.log("✅ Fixed.");
                    // Small delay to be nice to rate limits
                    await new Promise(r => setTimeout(r, 2000));
                } catch (err) {
                    console.error("Failed to fix:", err);
                }
            }
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
};

fixRecall();
