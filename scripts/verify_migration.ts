
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:3000/api';
// Connect to DB solely to clean up before test
const cleanDB = async () => {
    if (!process.env.MONGODB_URI) throw new Error("No MONGODB_URI");
    await mongoose.connect(process.env.MONGODB_URI);
    await mongoose.connection.dropDatabase();
    console.log("Database cleaned.");
    await mongoose.disconnect();
};

const runTests = async () => {
    try {
        console.log("Starting Verification...");

        // 1. Clean DB
        await cleanDB();

        // 2. Register Patient
        console.log("Registering Patient...");
        const patientRes = await axios.post(`${API_URL}/auth/register`, {
            email: 'patient@test.com',
            password: 'password123',
            role: 'PATIENT'
        });
        const patientToken = await axios.post(`${API_URL}/auth/login`, {
            email: 'patient@test.com',
            password: 'password123'
        }).then(r => r.data.token);
        const patientId = patientRes.data.userId;
        console.log("Patient Registered:", patientId);

        // 3. Register Doctor
        console.log("Registering Doctor...");
        const doctorRes = await axios.post(`${API_URL}/auth/register`, {
            email: 'doctor@test.com',
            password: 'password123',
            role: 'DOCTOR'
        });
        const doctorToken = await axios.post(`${API_URL}/auth/login`, {
            email: 'doctor@test.com',
            password: 'password123'
        }).then(r => r.data.token);
        const doctorId = doctorRes.data.userId;
        console.log("Doctor Registered:", doctorId);

        // 4. Patient Uploads Record
        console.log("Uploading Record...");
        const recordRes = await axios.post(`${API_URL}/records`, {
            type: 'LAB_REPORT',
            summary: 'Blood Test',
            isComplete: true
        }, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        console.log("Record Uploaded:", recordRes.data._id);

        // 5. Doctor Access (Should Fail)
        console.log("Testing Doctor Access (Should Fail)...");
        try {
            await axios.get(`${API_URL}/records?patientId=${patientId}`, {
                headers: { Authorization: `Bearer ${doctorToken}` }
            });
            console.error("❌ Doctor Access SHOULD HAVE FAILED but succeeded.");
            process.exit(1);
        } catch (e: any) {
            if (e.response && e.response.status === 403) {
                console.log("✅ Doctor Access Denied (Expected 403)");
            } else {
                console.error("❌ Doctor Access Failed with unexpected error:", e.message);
                process.exit(1);
            }
        }

        // 6. Grant Consent
        console.log("Granting Consent...");
        // Need Date string for validUntil
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 7);

        await axios.post(`${API_URL}/consent`, {
            doctorId: doctorRes.data.doctorCode, // Using doctor code as per controller logic
            validUntil: validUntil.toISOString()
        }, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        console.log("Consent Granted.");

        // 7. Doctor Access (Should Succeed)
        console.log("Testing Doctor Access (Should Succeed)...");
        const docAccessRes = await axios.get(`${API_URL}/records?patientId=${patientId}`, {
            headers: { Authorization: `Bearer ${doctorToken}` }
        });
        if (docAccessRes.data.length > 0) {
            console.log("✅ Doctor Access Succeeded. Records found:", docAccessRes.data.length);
        } else {
            console.error("❌ Doctor Access Succeeded but NO records found.");
            process.exit(1);
        }

        // 8. Emergency QR
        console.log("Generating Emergency QR...");
        const qrRes = await axios.post(`${API_URL}/emergency/generate`, {}, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        const qrToken = qrRes.data.qrToken;
        console.log("QR Generated:", qrToken);

        // 9. Emergency Access (Anonymous)
        console.log("Testing Emergency Access...");
        const emergencyRes = await axios.get(`${API_URL}/emergency/${qrToken}`);
        if (emergencyRes.data.patientId === patientId) {
            console.log("✅ Emergency Access Verified.");
        } else {
            console.error("❌ Emergency Access Failed: ID mismatch.");
            process.exit(1);
        }

        console.log("\n🎉 ALL MIGRATION TESTS PASSED!");

    } catch (error: any) {
        console.error("❌ Test Failed:", error.message);
        if (error.response) {
            console.error("Response Data:", error.response.data);
        }
        process.exit(1);
    }
};

// Wait a bit for server to start if running via concurrent command,
// but here we assume server is running.
setTimeout(runTests, 2000); // 2s delay
