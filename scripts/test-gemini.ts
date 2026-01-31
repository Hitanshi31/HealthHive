
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const GEMINI_MODEL = "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ Error: GEMINI_API_KEY not found in .env");
    process.exit(1);
}

const runTest = async () => {
    console.log(`Testing Gemini API with model: ${GEMINI_MODEL}`);
    console.log(`Key present: ${!!API_KEY}`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;

    const prompt = "Hello, this is a test connectivity check. Please reply with 'Confirmed'.";

    try {
        const response = await axios.post(url, {
            contents: [{
                parts: [{ text: prompt }]
            }]
        });

        if (response.data && response.data.candidates && response.data.candidates.length > 0) {
            const reply = response.data.candidates[0].content.parts[0].text;
            console.log("\n✅ AI Service is WORKING!");
            console.log(`Response: ${reply}`);
        } else {
            console.error("\n⚠️  AI Service returned no candidates.");
            console.log(JSON.stringify(response.data, null, 2));
        }

    } catch (error: any) {
        console.error("\n❌ AI Service Check FAILED.");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
};

runTest();
