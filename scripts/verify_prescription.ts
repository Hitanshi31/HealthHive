import axios from 'axios';

const API_URL = 'http://localhost:3004/api';
let patientToken = '';
let doctorToken = '';
let patientId = '';
let doctorId = '';

const registerUser = async (role: 'PATIENT' | 'DOCTOR', name: string) => {
    try {
        const email = `${name.toLowerCase().replace(' ', '')}_${Date.now()}@test.com`;
        const res = await axios.post(`${API_URL}/auth/register`, {
            name,
            email,
            password: 'password123',
            role
        });
        return { token: res.data.token, id: res.data.user.id, email };
    } catch (error: any) {
        console.error(`Register ${role} failed:`, error.response?.data || error.message);
        process.exit(1);
    }
};

const main = async () => {
    console.log("=== STARTING PRESCRIPTION FEATURE VERIFICATION ===");

    // 1. Setup Users
    console.log("\n1. creating Users...");
    const patientStr = await registerUser('PATIENT', 'Sick Sid');
    patientToken = patientStr.token;
    patientId = patientStr.id;

    const doctorStr = await registerUser('DOCTOR', 'Dr. Phil');
    doctorToken = doctorStr.token;
    doctorId = doctorStr.id;

    console.log(`   Patient ID: ${patientId}`);
    console.log(`   Doctor ID: ${doctorId}`);

    // 2. Grant Consent
    console.log("\n2. Granting Consent...");
    try {
        await axios.post(`${API_URL}/consent`, {
            doctorId: doctorId,
            validUntil: new Date(Date.now() + 86400000) // 24h
        }, { headers: { Authorization: `Bearer ${patientToken}` } });
        console.log("   Consent granted.");
    } catch (e: any) {
        console.error("   Consent failed:", e.response?.data);
        // It might be because I need to use the Doctor's CODE or Email depending on implementation.
        // Let's try to proceed, if fails here, subsequent steps fail.
    }

    // 3. Create Prescription
    console.log("\n3. Creating Prescription (Doctor)...");
    try {
        const res = await axios.post(`${API_URL}/records/prescription`, {
            patientId: patientId,
            medicines: [
                { name: 'Amoxicillin', dosage: '500mg', frequency: '3x daily', duration: '7 days', instructions: 'Take with food' },
                { name: 'Ibuprofen', dosage: '400mg', frequency: 'As needed', duration: '5 days', instructions: 'For pain' }
            ]
        }, { headers: { Authorization: `Bearer ${doctorToken}` } });
        console.log("   Prescription Created. ID:", res.data._id);
    } catch (e: any) {
        console.error("   Create Prescription Failed:", e.response?.data);
        process.exit(1);
    }

    // 4. Verify Ongoing Medicines (Doctor View)
    console.log("\n4. Verifying Ongoing Medicines (Doctor View)...");
    try {
        const res = await axios.get(`${API_URL}/records/ongoing`, {
            params: { targetPatientId: patientId },
            headers: { Authorization: `Bearer ${doctorToken}` }
        });
        console.log(`   Found ${res.data.length} ongoing medicines.`);
        if (res.data.length >= 2) console.log("   SUCCESS: Medicines found.");
        else console.error("   FAILURE: Expected medicines not found.");
    } catch (e: any) {
        console.error("   Get Ongoing Failed:", e.response?.data);
    }

    // 5. Verify Patient Timeline
    console.log("\n5. Verifying Patient Timeline Retrieval...");
    try {
        const res = await axios.get(`${API_URL}/records`, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        const prescriptions = res.data.filter((r: any) => r.type === 'PRESCRIPTION');
        console.log(`   Found ${prescriptions.length} prescription records.`);
        if (prescriptions.length > 0) console.log("   SUCCESS: Prescription visible in timeline.");
        else console.error("   FAILURE: Prescription not found.");
    } catch (e: any) {
        console.error("   Get Records Failed:", e.response?.data);
    }

    console.log("\n=== VERIFICATION COMPLETE ===");
};

main();
