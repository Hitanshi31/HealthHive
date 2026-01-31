import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define schema inline to be 100% sure we can access it independently of the rest of the app if needed
const MedicalRecordSchema = new mongoose.Schema({
    type: String,
    aiStatus: String,
    aiSummary: String,
    createdAt: Date
}, { strict: false });

const MedicalRecord = mongoose.models.MedicalRecord || mongoose.model('MedicalRecord', MedicalRecordSchema);

const run = async () => {
    try {
        console.log("Connecting to:", process.env.MONGODB_URI?.split('@')[1] || "URI not found");
        await mongoose.connect(process.env.MONGODB_URI as string);

        const count = await MedicalRecord.countDocuments();
        console.log("Total Records in DB:", count);

        const lastRecords = await MedicalRecord.find().sort({ createdAt: -1 }).limit(10);
        console.log("Latest 10 records:");
        lastRecords.forEach((r: any) => {
            console.log(`- ID: ${r._id} | Status: ${r.aiStatus || 'NULL'} | Created: ${r.createdAt} | SumLen: ${r.aiSummary?.length || 0}`);
        });

    } catch (e) {
        console.error("DIAGNOSTIC FAILED:", e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
