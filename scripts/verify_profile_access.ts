
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:3000/api';

async function runTest() {
    try {
        const timestamp = Date.now();
        const doctorEmail = `dr.${timestamp}@test.com`;
        const patientEmail = `pat.${timestamp}@test.com`;
        const password = 'password123';

        // 1. Register Doctor
        console.log(`\n1. Registering Doctor (${doctorEmail})...`);
        await axios.post(`${API_URL}/auth/register`, {
            email: doctorEmail,
            password,
            role: 'DOCTOR',
            fullName: 'Dr. Test',
            licenseNumber: `LIC-${timestamp}`
        });

        const docLogin = await axios.post(`${API_URL}/auth/login`, { email: doctorEmail, password });
        const docToken = docLogin.data.token;
        const docId = docLogin.data.userId;
        const docCode = docLogin.data.doctorCode;
        console.log(`Doctor logged in. ID: ${docId}, Code: ${docCode}`);

        // 2. Register Patient
        console.log(`\n2. Registering Patient (${patientEmail})...`);
        await axios.post(`${API_URL}/auth/register`, {
            email: patientEmail,
            password,
            role: 'PATIENT',
            fullName: 'Patrick Test'
        });

        const patLogin = await axios.post(`${API_URL}/auth/login`, { email: patientEmail, password });
        const patToken = patLogin.data.token;
        const patId = patLogin.data.userId;
        console.log(`Patient logged in. ID: ${patId}`);

        // 3a. Creating Dependent
        console.log(`\n3a. Creating Dependent...`);
        const depRes = await axios.post(`${API_URL}/dependents`, {
            name: 'Bib Test',
            dateOfBirth: '2020-01-01',
            gender: 'Male',
            relationship: 'Son'
        }, {
            headers: { Authorization: `Bearer ${patToken}` }
        });
        const dependentId = depRes.data.id;
        console.log(`Dependent created. ID: ${dependentId}`);

        // 3b. Grant Consent for Primary
        console.log(`\n3b. Granting Consent to Doctor (Primary)...`);
        const validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 1);

        await axios.post(`${API_URL}/consent`, {
            doctorId: docCode, // Using Code as per UI
            validUntil: validUntil.toISOString(),
            accessLevels: ['READ'],
            subjectProfileId: null // Primary profile
        }, {
            headers: { Authorization: `Bearer ${patToken}` }
        });
        console.log("Consent granted (Primary).");

        // 3c. Grant Consent for Dependent
        console.log(`\n3c. Granting Consent to Doctor (Dependent)...`);
        await axios.post(`${API_URL}/consent`, {
            doctorId: docCode,
            validUntil: validUntil.toISOString(),
            accessLevels: ['READ'],
            subjectProfileId: dependentId
        }, {
            headers: { Authorization: `Bearer ${patToken}` }
        });
        console.log("Consent granted (Dependent).");

        // 4. Doctor Fetches Patients
        console.log(`\n4. Doctor Fetching Patients List...`);
        const patientsRes = await axios.get(`${API_URL}/consent/doctor-patients`, {
            headers: { Authorization: `Bearer ${docToken}` }
        });
        const patients = patientsRes.data;
        console.log(`Doctor sees ${patients.length} patients.`);

        // Test Primary
        const primaryEntry = patients.find((p: any) => p.patientId === patId && !p.subjectProfileId);
        if (primaryEntry) {
            console.log(`Testing Primary Profile Access...`);
            try {
                const profileRes = await axios.get(`${API_URL}/profile/${primaryEntry.patientId}`, {
                    headers: { Authorization: `Bearer ${docToken}` }
                });
                console.log(`SUCCESS: Got Primary profile: ${profileRes.data.fullName}`);
            } catch (err: any) {
                console.error(`FAILED Primary: ${err.message}`);
            }
        }

        // Test Dependent
        const depEntry = patients.find((p: any) => p.subjectProfileId === dependentId);
        if (depEntry) {
            console.log(`Testing Dependent Profile Access (ID: ${dependentId})...`);
            try {
                const depProfileRes = await axios.get(`${API_URL}/profile/${dependentId}`, {
                    headers: { Authorization: `Bearer ${docToken}` }
                });
                console.log(`SUCCESS: Got Dependent profile: ${depProfileRes.data.fullName}`);
                console.log(`Profile Keys: ${Object.keys(depProfileRes.data).join(', ')}`);
            } catch (err: any) {
                console.error(`FAILED Dependent: ${err.message}`);
                if (err.response) console.error(err.response.data);
            }

            // 6. Test Orphan Cleanup
            console.log(`\n6. Testing Orphan Cleanup...`);
            console.log(`Deleting Dependent ${dependentId}...`);
            await axios.delete(`${API_URL}/dependents/${dependentId}`, {
                headers: { Authorization: `Bearer ${patToken}` }
            });
            console.log(`Dependent deleted.`);

            console.log(`Doctor fetching patients again...`);
            const patientsRes2 = await axios.get(`${API_URL}/consent/doctor-patients`, {
                headers: { Authorization: `Bearer ${docToken}` }
            });
            const patients2 = patientsRes2.data;
            const depEntry2 = patients2.find((p: any) => p.subjectProfileId === dependentId);

            if (!depEntry2) {
                console.log(`SUCCESS: Deleted dependent is GONE from doctor's list.`);
            } else {
                console.error(`FAILED: Deleted dependent STILL VISIBLE in list!`);
            }

        } else {
            console.error("Dependent not found in doctor's list!");
        }

    } catch (error: any) {
        console.error("Test failed:", error.message);
        if (error.response) console.error(error.response.data);
    }
}

runTest();
