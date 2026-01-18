import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testFlow() {
    try {
        console.log('--- Starting HealthHive Backend Test ---');

        console.log('\n1. Registering Patient...');
        const patientEmail = `patient_${Date.now()}@test.com`;
        const patientRes = await axios.post(`${API_URL}/auth/register`, {
            email: patientEmail,
            password: 'password123',
            role: 'PATIENT'
        });
        console.log('PATIENT Registered:', patientRes.data);

        // Login Patient
        const patientLogin = await axios.post(`${API_URL}/auth/login`, {
            email: patientEmail,
            password: 'password123'
        });
        const patientToken = patientLogin.data.token;
        console.log('PATIENT Logged In.');

        console.log('\n2. Uploading Medical Record...');
        const uploadRes = await axios.post(`${API_URL}/records`, {
            type: 'LAB_REPORT',
            summary: 'Blood test results',
            source: 'City Lab',
            isComplete: true
        }, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        console.log('Record Uploaded:', uploadRes.data);

        console.log('\n3. Retrieving Records (Self)...');
        const recordsRes = await axios.get(`${API_URL}/records`, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        console.log('Records Retrieved:', recordsRes.data.length, 'records found.');
        console.log('Trust Indicator:', recordsRes.data[0]?.trustIndicator); // Check new feature

        console.log('\n--- Test Complete: SUCCESS ---');
    } catch (error: any) {
        console.error('--- Test Failed ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testFlow();
