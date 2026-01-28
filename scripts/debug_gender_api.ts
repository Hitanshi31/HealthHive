
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const run = async () => {
    try {
        // 1. Register/Login a female user
        const email = `female_test_${Date.now()}@test.com`;
        const password = 'password123';

        console.log(`Registering ${email}...`);
        await axios.post(`${API_URL}/auth/register`, {
            email,
            password,
            role: 'PATIENT',
            gender: 'Female'
        });

        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });

        const { token, userId } = loginRes.data;
        console.log(`Got token for user ${userId}`);

        // 2. Fetch Health Basics
        console.log('Fetching health-basics...');
        const basicsRes = await axios.get(`${API_URL}/user/${userId}/health-basics`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Health Basics Response:', JSON.stringify(basicsRes.data, null, 2));

        if (basicsRes.data.gender === 'Female') {
            console.log('SUCCESS: Gender is Female');
        } else {
            console.log('FAILURE: Gender is NOT Female:', basicsRes.data.gender);
        }

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
};

run();
