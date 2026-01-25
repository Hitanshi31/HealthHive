import axios from 'axios';

const API_URL = 'http://localhost:3008/api';
let patientToken = '';
let doctorToken = '';
let patientId = '';
let doctorId = '';
let doctorUserId = '';
let dependentId = '';

const registerUser = async (role: 'PATIENT' | 'DOCTOR', name: string) => {
    try {
        const email = `${name.toLowerCase().replace(' ', '')}_${Date.now()}@test.com`;
        const res = await axios.post(`${API_URL}/auth/register`, {
            name,
            email,
            password: 'password123',
            role
        });
        const id = res.data.user?.id || res.data.userId;
        const returnedEmail = res.data.user?.email || (res.config.data && JSON.parse(res.config.data).email);
        return { token: res.data.token, id, email: returnedEmail };
    } catch (error: any) {
        console.error(`Register ${role} failed:`, error.response?.data || error.message);
        process.exit(1);
    }
};

const main = async () => {
    console.log("=== STARTING DEPENDENT PRESCRIPTION VERIFICATION ===");

    // 1. Setup Users
    console.log("\n1. creating Users...");
    const patientStr = await registerUser('PATIENT', 'Mom Mary');
    patientToken = patientStr.token;
    patientId = patientStr.id;

    const doctorStr = await registerUser('DOCTOR', 'Dr. House');
    doctorToken = doctorStr.token;
    doctorUserId = doctorStr.id;

    console.log(`   Patient: ${patientId}, Doctor: ${doctorUserId}`);

    // 2. Add Dependent
    console.log("\n2. Adding Dependent (Child)...");
    try {
        const res = await axios.post(`${API_URL}/dependents`, {
            name: 'Tiny Tim',
            dateOfBirth: '2020-01-01',
            gender: 'Male',
            relationship: 'Child'
        }, { headers: { Authorization: `Bearer ${patientToken}` } });
        dependentId = res.data.id; // Dependent UUID
        console.log(`   Dependent Created. ID: ${dependentId}`);
    } catch (e: any) {
        console.error("   Add Dependent Failed:", e.response?.data);
        process.exit(1);
    }

    // 3. Grant Consent for Dependent
    console.log("\n3. Granting Consent for Dependent...");
    try {
        await axios.post(`${API_URL}/consent`, {
            doctorId: doctorUserId,
            subjectProfileId: dependentId,
            validUntil: new Date(Date.now() + 86400000)
        }, { headers: { Authorization: `Bearer ${patientToken}` } });
        console.log("   Consent granted for Dependent.");
    } catch (e: any) {
        console.error("   Consent failed:", e.response?.data);
        process.exit(1);
    }

    // 4. Verify Doctor sees Dependent in List (and has subjectProfileId)
    console.log("\n4. Verifying Doctor List...");
    try {
        const res = await axios.get(`${API_URL}/consent/doctor-patients`, {
            headers: { Authorization: `Bearer ${doctorToken}` }
        });
        const patientEntry = res.data.find((p: any) => p.subjectProfileId === dependentId);
        if (patientEntry) {
            console.log("   SUCCESS: Doctor sees dependent in list with correct subjectProfileId.");
        } else {
            console.error("   FAILURE: Dependent not found in doctor's list or missing ID.");
            console.log("   List:", JSON.stringify(res.data, null, 2));
            process.exit(1);
        }
    } catch (e: any) {
        console.error("   List failed:", e.response?.data);
    }

    // 5. Create Prescription for Dependent
    console.log("\n5. Creating Prescription for Dependent...");
    try {
        const res = await axios.post(`${API_URL}/records/prescription`, {
            patientId: patientId, // Parent ID
            subjectProfileId: dependentId, // Dependent ID
            medicines: [
                { name: 'Baby Aspirin', dosage: '81mg', frequency: 'Daily', duration: '7 days', instructions: 'With milk' }
            ]
        }, { headers: { Authorization: `Bearer ${doctorToken}` } });
        console.log("   Prescription Created. ID:", res.data._id);
    } catch (e: any) {
        console.error("   Create Prescription Failed:", e.response?.data);
        process.exit(1);
    }

    // 6. Verify Ongoing Medicines for Dependent
    console.log("\n6. Verifying Ongoing Medicines (Dependent View)...");
    try {
        // As Doctor viewing Dependent
        const res = await axios.get(`${API_URL}/records/ongoing`, {
            params: { targetPatientId: patientId, subjectProfileId: dependentId },
            headers: { Authorization: `Bearer ${doctorToken}` }
        });
        console.log(`   Found ${res.data.length} ongoing medicines.`);
        if (res.data.length > 0) console.log("   SUCCESS: Medicines found.");
        else console.error("   FAILURE: Expected medicines not found.");
    } catch (e: any) {
        console.error("   Get Ongoing Failed:", e.response?.data);
    }

    console.log("\n=== VERIFICATION COMPLETE ===");
};

main();
