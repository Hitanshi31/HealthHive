
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User';

dotenv.config();

const API_URL = 'http://localhost:3000/api';

async function runDemo() {
    console.log("=== FHIR HACKATHON DEMO START ===");

    // 1. SETUP: Create Patient and Doctor
    // We assume they might exist or we register fresh ones to prompt clean state.
    // For simplicity, let's register generic Test users.
    const patientEmail = `patient_fhir_${Date.now()}@demo.com`;
    const doctorEmail = `doctor_fhir_${Date.now()}@demo.com`;
    const password = 'Password123!';

    console.log(`\n[SETUP] Creating Users...`);

    // Register Patient
    let patientToken = '';
    let patientId = '';
    try {
        const pReg = await axios.post(`${API_URL}/auth/register`, {
            email: patientEmail,
            password,
            role: 'PATIENT'
        });
        // Login to get token with ID
        const pLog = await axios.post(`${API_URL}/auth/login`, { email: patientEmail, password });
        patientToken = pLog.data.token;
        patientId = pLog.data.userId;
        console.log(`✅ Patient Created: ${patientEmail} (ID: ${patientId})`);
    } catch (e: any) {
        console.error("Setup failed (Patient):", e.response?.data || e.message);
        return;
    }

    // Register Doctor
    let doctorToken = '';
    let doctorId = '';
    try {
        const dReg = await axios.post(`${API_URL}/auth/register`, {
            email: doctorEmail,
            password,
            role: 'DOCTOR'
        });
        const dLog = await axios.post(`${API_URL}/auth/login`, { email: doctorEmail, password });
        doctorToken = dLog.data.token;
        doctorId = dLog.data.userId;
        console.log(`✅ Doctor Created: ${doctorEmail} (ID: ${doctorId})`);
    } catch (e: any) {
        console.error("Setup failed (Doctor):", e.response?.data || e.message);
        return;
    }

    // 2. FLOW 1: PATIENT IDENTITY (Patient accesses own FHIR record)
    console.log(`\n[FLOW 1] Patient Identity (Self-Access)`);
    try {
        const res = await axios.get(`${API_URL}/fhir/v1/Patient/${patientId}`, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        if (res.status === 200 && res.data.resourceType === 'Patient') {
            console.log(`✅ SUCCESS: Patient retrieved own record.`);
            console.log(`   - Resource Type: ${res.data.resourceType}`);
            console.log(`   - ID: ${res.data.id}`);
        } else {
            console.error(`❌ FAILED: Unexpected response`, res.data);
        }
    } catch (e: any) {
        console.error(`❌ FAILED:`, e.response?.data || e.message);
    }

    // 3. NEGATIVE TEST: Doctor accesses Patient WITHOUT Consent
    console.log(`\n[FLOW 2-A] Doctor Accesses Patient WITHOUT Consent (Expected: 403)`);
    try {
        await axios.get(`${API_URL}/fhir/v1/Patient/${patientId}`, {
            headers: { Authorization: `Bearer ${doctorToken}` }
        });
        console.error(`❌ FAILED: Doctor was NOT blocked!`);
    } catch (e: any) {
        if (e.response?.status === 403) {
            console.log(`✅ SUCCESS: Doctor blocked as expected (403 Forbidden).`);
        } else {
            console.error(`❌ FAILED: Unexpected error code ${e.response?.status}`, e.response?.data);
        }
    }

    // 4. FLOW 3: GRANT CONSENT
    console.log(`\n[FLOW 3] Patient Grants Consent`);
    try {
        const consentRes = await axios.post(`${API_URL}/fhir/v1/Consent`, {
            doctorId: doctorId,
            validDays: 30
        }, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });

        if (consentRes.status === 201 && consentRes.data.resourceType === 'Consent') {
            console.log(`✅ SUCCESS: Consent granted.`);
            console.log(`   - ID: ${consentRes.data.id}`);
            console.log(`   - Status: ${consentRes.data.status}`);
        }
    } catch (e: any) {
        console.error(`❌ FAILED: Could not grant consent`, e.response?.data || e.message);
    }

    // 5. FLOW 1-B: Doctor accesses Patient WITH Consent
    console.log(`\n[FLOW 1-B] Doctor Accesses Patient WITH Consent (Expected: 200)`);
    try {
        const res = await axios.get(`${API_URL}/fhir/v1/Patient/${patientId}`, {
            headers: { Authorization: `Bearer ${doctorToken}` }
        });
        if (res.status === 200 && res.data.resourceType === 'Patient') {
            console.log(`✅ SUCCESS: Doctor allowed access.`);
        } else {
            console.error(`❌ FAILED: Unexpected response`, res.data);
        }
    } catch (e: any) {
        console.error(`❌ FAILED:`, e.response?.data || e.message);
    }

    // 6. FLOW 2: CLINICAL DOCUMENTS
    console.log(`\n[FLOW 2] Doctor Fetches Clinical Docs (DocumentReference)`);
    try {
        const docRes = await axios.get(`${API_URL}/fhir/v1/DocumentReference?patient=${patientId}`, {
            headers: { Authorization: `Bearer ${doctorToken}` }
        });
        if (docRes.status === 200 && docRes.data.resourceType === 'Bundle') {
            console.log(`✅ SUCCESS: Documents Bundle retrieved.`);
            console.log(`   - Total: ${docRes.data.total}`);
        } else {
            console.error(`❌ FAILED: Unexpected response`, docRes.data);
        }
    } catch (e: any) {
        console.error(`❌ FAILED:`, e.response?.data || e.message);
    }

    console.log("\n=== DEMO COMPLETE ===");
}

runDemo();
