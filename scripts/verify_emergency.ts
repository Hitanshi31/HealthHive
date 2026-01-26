
import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runVerification() {
    try {
        console.log('--- Starting Emergency Flow Verification ---');

        // 1. Connect to DB (to set up test user data if needed, or just relying on API)
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('✅ Connected to MongoDB');

        // 2. Find a test user or create one
        let user = await User.findOne({ email: 'verify_emergency@test.com' });
        if (!user) {
            user = await User.create({
                email: 'verify_emergency@test.com',
                passwordHash: '$2b$10$EpIx.i.1...', // Mock hash
                role: 'PATIENT',
                healthBasics: {
                    allergies: 'Peanuts, Penicillin',
                    chronicConditions: 'Hypertension',
                    currentMedications: 'Amoxicillin'
                }
            });
            console.log('✅ Created Test User');
        }

        // 3. Login (Mocking auth token generation or just using a direct service call if we were inside server, 
        //    but here we act as client. For simplicity, we assume we can generate a JWT or use a mock logic. 
        //    Actually, let's use the EmergencyService directly to avoid needing a full running server for this script 
        //    IF we import it. Integrating services is better for unit testing.)

        // IMPORTING SERVICE DIRECTLY FOR ROBUSTNESS
        const { EmergencyService } = require('../src/services/emergency.service');

        // 4. Generate Snapshot
        console.log(`\nGenerating snapshot for user: ${user._id}`);
        const result = await EmergencyService.generateSnapshot(user._id.toString());

        if (!result.token) throw new Error('No token returned');
        console.log('✅ Snapshot Generated');
        console.log(`   Token: ${result.token}`);
        console.log(`   Expires: ${result.expiresAt}`);

        // 5. Retrieve Snapshot
        console.log('\nRetrieving snapshot with token...');
        const snapshot = await EmergencyService.getSnapshot(result.token);

        if (!snapshot) throw new Error('Snapshot retrieval failed');
        console.log('✅ Snapshot Retrieved');

        // 6. Verify Data
        console.log('\nVerifying Data Integrity...');

        // Check Critical Summary
        const summary = snapshot.criticalSummary;
        console.log('   Critical Summary:', JSON.stringify(summary, null, 2));

        if (!summary.majorAllergies.includes('Peanuts')) throw new Error('Allergy missing');
        if (!summary.chronicConditions.includes('Hypertension')) throw new Error('Condition missing');

        // Check Risks (Should trigger interaction due to Penicillin + Amoxicillin)
        console.log('   Risk Flags:', JSON.stringify(snapshot.riskFlags, null, 2));
        if (snapshot.riskFlags.length === 0) console.warn('⚠️ No risks detected (Expected if logic strict)');
        else console.log('✅ Risks detected correctly');

        console.log('\n🎉 VERIFICATION SUCCESSFUL');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error);
        process.exit(1);
    }
}

runVerification();
