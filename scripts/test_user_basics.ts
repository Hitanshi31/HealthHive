import axios from 'axios';
import dotenv from 'dotenv';
import User from '../src/models/User'; // Just for typing if needed

dotenv.config();

const API_URL = 'http://localhost:3000/api';

async function testHealthBasics() {
    console.log("=== HEALTH BASICS TEST START ===");

    const email = `test_basics_${Date.now()}@test.com`;
    const password = 'Password123!';

    // 1. Register Patient
    console.log(`\n[1] Registering Patient: ${email}`);
    let token = '';
    let userId = '';
    try {
        await axios.post(`${API_URL}/auth/register`, {
            email, password, role: 'PATIENT'
        });
        const login = await axios.post(`${API_URL}/auth/login`, {
            email, password
        });
        token = login.data.token;
        userId = login.data.userId;
        console.log(`✅ Registered & Logged in. ID: ${userId}`);
        console.log(`   HasSeenBasics: ${login.data.hasSeenBasicsPrompt}`);
    } catch (e: any) {
        console.error("Setup failed:", e.response?.data || e.message);
        return;
    }

    // 2. Update Health Basics
    console.log(`\n[2] Updating Health Basics...`);
    try {
        const updateRes = await axios.put(`${API_URL}/user/health-basics`, {
            allergies: "Peanuts",
            chronicConditions: "None",
            currentMedications: "Vitamin D",
            skip: false // Explicitly saving
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ Update Response Code: ${updateRes.status}`);
        console.log(`   User Data:`, updateRes.data.user.healthBasics);
    } catch (e: any) {
        console.error("❌ Update failed:", e.response?.data || e.message);
    }

    // 3. Retrieve Health Basics (Profile View)
    console.log(`\n[3] Retrieving Health Basics...`);
    try {
        const getRes = await axios.get(`${API_URL}/user/${userId}/health-basics`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Get Response Code: ${getRes.status}`);
        console.log(`   Health Basics:`, getRes.data.healthBasics);
        console.log(`   HasSeenBasics: ${getRes.data.hasSeenBasicsPrompt}`);

        if (getRes.data.healthBasics?.allergies === 'Peanuts' && getRes.data.hasSeenBasicsPrompt === true) {
            console.log("\n✅ SUCCESS: Basics verified securely stored.");
        } else {
            console.error("\n❌ FAILED: Data mismatch.");
        }

    } catch (e: any) {
        console.error("❌ Retrieval failed:", e.response?.data || e.message);
    }

    console.log("=== TEST COMPLETE ===");
}

testHealthBasics();
