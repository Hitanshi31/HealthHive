
import axios from 'axios';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:3000/api';

async function verifySafetyCheck() {
    try {
        // 1. Login as Doctor
        console.log('Logging in as Doctor...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'doctor@test.com', // Assuming this doctor exists from previous tests
            password: 'password123'
        });
        console.log('Login Response Status:', loginRes.status);
        console.log('Login Response Data:', JSON.stringify(loginRes.data, null, 2));

        const token = loginRes.data.token;
        const doctorId = loginRes.data.userId || loginRes.data.user?.id || loginRes.data.user?._id;
        if (!doctorId) throw new Error('Doctor ID not found in login response');

        console.log(`Doctor logged in. ID: ${doctorId}`);

        // 2. Find a patient (active consent)
        // For this test, we might need a known patient ID. 
        // Let's try to fetch doctor's patients and pick one.
        console.log('Fetching doctor patients...');
        const patientsRes = await axios.get(`${API_URL}/consent/doctor-patients`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const patients = patientsRes.data;
        let targetPatientId = doctorId; // Default to self for testing plumbing
        let targetPatientName = "Self (Doctor)";

        if (patients.length > 0) {
            targetPatientId = patients[0]._id; // or patients[0].id
            targetPatientName = patients[0].fullName;
        } else {
            console.warn('No patients found. Using Doctor ID for self-check (testing plumbing).');
        }

        console.log(`Testing Safety Check for patient: ${targetPatientName} (${targetPatientId})`);

        // 3. Call Safety Check
        console.log('Calling Safety Check API...');
        const safetyRes = await axios.post(`${API_URL}/safety/check/${targetPatientId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Safety Check Response:', JSON.stringify(safetyRes.data, null, 2));

        // 4. Validate Structure
        const { summary, disclaimer } = safetyRes.data;
        if (summary && typeof summary.potentialDuplication === 'boolean' && disclaimer) {
            console.log('✅ Verification PASSED: Response structure is valid.');
        } else {
            console.error('❌ Verification FAILED: Invalid response structure.');
        }

    } catch (error: any) {
        console.error('Verification failed:', error.response ? error.response.data : error.message);
    }
}

verifySafetyCheck();
