
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import MedicalRecord from '../src/models/MedicalRecord';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const checkRecords = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error("No Mongo URI");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const records = await MedicalRecord.find({ type: { $ne: 'PRESCRIPTION' } }).sort({ createdAt: -1 }).limit(5);

        console.log(`Found ${records.length} recent records:`);
        records.forEach(r => {
            console.log("------------------------------------------------");
            console.log(`ID: ${r._id}`);
            console.log(`Type: ${r.type}`);
            console.log(`Created: ${r.createdAt}`);
            console.log(`AI Summary (Patient): ${r.aiPatientSummary ? r.aiPatientSummary.substring(0, 50) + '...' : 'MISSING'}`);
            console.log(`AI Summary (Doctor): ${r.aiSummary ? r.aiSummary.substring(0, 50) + '...' : 'MISSING'}`);
        });

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
};

checkRecords();
