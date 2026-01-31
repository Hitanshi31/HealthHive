
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import MedicalRecord from '../src/models/MedicalRecord';
import aiService from '../src/services/ai.service';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const slowFix = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error("No Mongo URI");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const getBrokenRecords = async () => {
            return await MedicalRecord.find({
                type: { $ne: 'PRESCRIPTION' },
                $or: [
                    { aiSummary: { $regex: /MOCK AI/ } },
                    { aiSummary: { $exists: false } },
                    { aiSummary: "" }
                ]
            }).sort({ createdAt: -1 });
        };

        let records = await getBrokenRecords();
        console.log(`⚠️  Found ${records.length} broken records.`);

        while (records.length > 0) {
            const record = records[0]; // Take first one
            console.log(`\nProcessing ID: ${record._id}`);

            await aiService.processRecord(record._id.toString());

            // Check if fixed
            const updated = await MedicalRecord.findById(record._id);
            if (updated && updated.aiSummary && !updated.aiSummary.includes("MOCK AI")) {
                console.log("✅ Fixed successfully!");
                // Wait 10s before next one to avoid hitting limit again immediately
                console.log("Waiting 10s...");
                await new Promise(r => setTimeout(r, 10000));
            } else {
                console.log("❌ Still Mock/Failed. Rate limit likely active.");
                console.log("⏳ Waiting 65 seconds to clear quota...");
                await new Promise(r => setTimeout(r, 65000));
            }

            // Refresh list
            records = await getBrokenRecords();
            console.log(`Remaining broken records: ${records.length}`);
        }

        console.log("🎉 ALL DONE! No broken records left.");
        await mongoose.disconnect();

    } catch (e) {
        console.error(e);
    }
};

slowFix();
