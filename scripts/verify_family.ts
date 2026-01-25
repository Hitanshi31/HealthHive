import axios from 'axios';
import { randomUUID } from 'crypto';

const API_URL = 'http://localhost:3001/api';

// Mocks
const PATIENT_EMAIL = `patient_family_${Date.now()}@example.com`;
const DOCTOR_EMAIL = `doctor_family_${Date.now()}@example.com`;
const PASSWORD = 'password123';

async function runTest() {
    try {
        console.log("=== STARTING FAMILY PROFILES VERIFICATION ===");

        // 1. Register/Login Patient
        console.log("\n1. Authenticating Patient...");
        let patientToken = '';
        let patientUserId = '';
        try {
            await axios.post(`${API_URL}/auth/register`, {
                email: PATIENT_EMAIL, password: PASSWORD, role: 'PATIENT'
            });
            // Register success, now login
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: PATIENT_EMAIL, password: PASSWORD
            });
            patientToken = loginRes.data.token;
            patientUserId = loginRes.data.userId;
        } catch (e: any) {
            if (e.response?.status === 400 || e.response?.status === 500) {
                const res = await axios.post(`${API_URL}/auth/login`, {
                    email: PATIENT_EMAIL, password: PASSWORD
                });
                patientToken = res.data.token;
                patientUserId = res.data.userId;
            } else throw e;
        }
        console.log("Patient Token obtained:", patientToken);

        // 2. Register/Login Doctor
        console.log("\n2. Authenticating Doctor...");
        let doctorToken = '';
        let doctorId = '';
        try {
            await axios.post(`${API_URL}/auth/register`, {
                email: DOCTOR_EMAIL, password: PASSWORD, role: 'DOCTOR'
            });
            // Login to be sure
            const loginRes = await axios.post(`${API_URL}/auth/login`, { email: DOCTOR_EMAIL, password: PASSWORD });
            doctorToken = loginRes.data.token;
            doctorId = loginRes.data.userId;
        } catch (e: any) {
            const res = await axios.post(`${API_URL}/auth/login`, {
                email: DOCTOR_EMAIL, password: PASSWORD
            });
            doctorToken = res.data.token;
            doctorId = res.data.userId;
        }
        console.log("Doctor Token obtained. ID:", doctorId);


        // 3. Create Dependent
        console.log("\n3. Creating Dependent 'Baby Doe'...");
        const dependentData = {
            name: "Baby Doe",
            dateOfBirth: "2025-01-01",
            gender: "Male",
            relationship: "Child",
            healthBasics: { allergies: ["Peanuts"], chronicConditions: [], currentMedications: [] }
        };
        const depRes = await axios.post(`${API_URL}/dependents`, dependentData, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        const dependentId = depRes.data.id;
        console.log("Dependent Created. ID:", dependentId);


        // 4. Upload Record for Dependent
        console.log("\n4. Uploading Record for Dependent...");
        const recordRes = await axios.post(`${API_URL}/records`, {
            type: "VACCINATION",
            summary: "Polio Vaccine",
            isComplete: true,
            subjectProfileId: dependentId
        }, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        console.log("Record Uploaded. ID:", recordRes.data._id);


        // 5. Verify Patient sees Dependent Record
        console.log("\n5. Verifying Patient View...");
        const viewRes = await axios.get(`${API_URL}/records?subjectProfileId=${dependentId}`, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        const hasRecord = viewRes.data.some((r: any) => r.subjectProfileId === dependentId);
        if (!hasRecord) throw new Error("Patient cannot see dependent record!");
        console.log("Patient can see dependent record: OK");


        // 6. Grant Consent to Doctor for Dependent
        console.log("\n6. Granting Consent for Dependent...");
        /* 
           Wait, docId in consent is User ID. 
           But API might expect plain ID or 'DOC-...' 
           Let's use the ID we got.
        */
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 1);
        await axios.post(`${API_URL}/consent`, {
            doctorId: doctorId,
            validUntil: expiry,
            subjectProfileId: dependentId
        }, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        console.log("Consent Granted.");


        // 7. Verify Doctor Access
        console.log("\n7. Verifying Doctor Access (Strict match)...");
        // A) Should see record if patientId and subjectProfileId match
        /* 
           Doctor GET /records requires:
           - patientId (Patient's User ID, NOT Dependent ID)
           - subjectProfileId (Dependent ID)
        */

        // Need Patient User ID.
        // const patientMe = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${patientToken}` } });
        // const patientUserId = patientMe.data.userId;
        console.log("Using Patient User ID:", patientUserId);

        const docViewRes = await axios.get(`${API_URL}/records?patientId=${patientUserId}&subjectProfileId=${dependentId}`, {
            headers: { Authorization: `Bearer ${doctorToken}` }
        });

        const docSees = docViewRes.data.some((r: any) => r.subjectProfileId === dependentId);
        if (!docSees) throw new Error("Doctor CANNOT see dependent record despite consent!");
        console.log("Doctor sees dependent record: OK");

        // 8. Verify Doctor CANNOT see Primary Record (No consent for primary)
        console.log("\n8. Verifying Doctor CANNOT see Primary Record...");
        try {
            await axios.get(`${API_URL}/records?patientId=${patientUserId}`, { // Implies subjectProfileId=null
                headers: { Authorization: `Bearer ${doctorToken}` }
            });
            throw new Error("Doctor accessed Primary profile WITHOUT consent! Security fail.");
        } catch (e: any) {
            if (e.response?.status === 403) {
                console.log("Acccess Denied for Primary Profile (Expected): OK");
            } else {
                throw e; // Unexpected error
            }
        }

        console.log("\n=== VERIFICATION SUCCESSFUL ===");

    } catch (error: any) {
        console.error("\n!!! VERIFICATION FAILED !!!");
        console.error(error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
    }
}

runTest();
