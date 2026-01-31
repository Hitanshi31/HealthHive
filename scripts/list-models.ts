
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ Error: GEMINI_API_KEY not found in .env");
    process.exit(1);
}

const listModels = async () => {
    console.log("Fetching available models...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await axios.get(url);
        if (response.data && response.data.models) {
            const models = response.data.models.map((m: any) => m.name);
            console.log("Models:", models);
            const fs = require('fs');
            fs.writeFileSync('models.json', JSON.stringify(response.data, null, 2));
        }
    } catch (error: any) {
        console.error("❌ Failed to list models.");
        if (error.response) {
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
};

listModels();
