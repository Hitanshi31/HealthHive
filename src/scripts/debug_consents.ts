
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Consent from '../models/Consent';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};


const debugState = async () => {
    await connectDB();
    const fs = require('fs');
    let output = '';

    output += '\n--- USERS ---\n';
    const users = await User.find({});
    users.forEach(u => {
        output += `ID: ${u._id}, Email: ${u.email}, Role: ${u.role}, DocCode: ${u.doctorCode || 'N/A'}\n`;
    });

    output += '\n--- CONSENTS ---\n';
    const consents = await Consent.find({}).populate('patientId').populate('doctorId');
    consents.forEach(c => {
        const patient = c.patientId as any;
        const doctor = c.doctorId as any;
        output += `Consent ID: ${c._id}\n`;
        output += `  Patient: ${patient ? patient.email : 'NULL'} (${c.patientId ? (c.patientId as any)._id : 'MISSING'})\n`;
        output += `  Doctor: ${doctor ? doctor.email : 'NULL'} (${c.doctorId ? (c.doctorId as any)._id : 'MISSING'})\n`;
        output += `  Status: ${c.status}\n`;
        output += `  ValidUntil: ${c.validUntil} (Now: ${new Date()})\n`;
        output += `  Is Active? ${c.status === 'ACTIVE' && new Date(c.validUntil) > new Date()}\n`;
        output += '-----------------------------------\n';
    });


    // Test the specific query failure
    const distinctDoctorId = '696e319154b60dee8501c219'; // Copied from debug output
    console.log(`\nTesting query for doctor: ${distinctDoctorId}`);

    // Check type of doctorId in DB
    const sampleConsent = await Consent.findOne({ doctorId: distinctDoctorId });
    if (sampleConsent) {
        console.log(`Found a consent for this doctor. DoctorID type: ${typeof sampleConsent.doctorId} (is object? ${sampleConsent.doctorId instanceof mongoose.Types.ObjectId})`);
    } else {
        console.log("No consent found for this doctor ID at all.");
    }

    const patients = await Consent.find({
        doctorId: distinctDoctorId,
        status: 'ACTIVE',
        validUntil: { $gt: new Date() }
    }).populate('patientId', 'email patientCode');

    console.log(`Query result count: ${patients.length}`);
    patients.forEach(p => {
        console.log('Result:', JSON.stringify(p));
    });

    output += `\nTest Query Result Count: ${patients.length}\n`;
    fs.writeFileSync('debug_output.txt', output);
    if (patients.length > 0) console.log('Query SUCCESS - Found patients');
    else console.log('Query FAILED - No patients found');

    mongoose.connection.close();
};

debugState();


