
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import MedicalRecord from '../src/models/MedicalRecord';
import fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const GEMINI_MODEL = "gemini-2.0-flash";

const debugAI = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error("No Mongo URI");
        await mongoose.connect(process.env.MONGODB_URI);

        // Find the record that is failing (the one with MOCK AI summary)
        const record = await MedicalRecord.findOne({
            type: { $ne: 'PRESCRIPTION' },
            aiSummary: { $regex: /MOCK AI/ }
        });

        if (!record) {
            console.log("No Mock AI records found to debug.");
            return;
        }

        console.log(`Debugging Record: ${record._id}`);
        console.log(`File Path: ${record.filePath}`);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("No API Key");

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

        // Reconstruct payload EXACTLY as ai.service.ts does
        let filePart = null;
        if (record.filePath && fs.existsSync(record.filePath)) {
            console.log("File exists on disk.");
            const fileData = fs.readFileSync(record.filePath);
            const base64Data = fileData.toString('base64');
            const ext = path.extname(record.filePath).toLowerCase();
            let mimeType = 'application/pdf';
            if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
            if (ext === '.png') mimeType = 'image/png';

            console.log(`MimeType: ${mimeType}`);
            console.log(`Base64 Length: ${base64Data.length}`);

            filePart = {
                inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                }
            };
        } else {
            console.warn("⚠️ File NOT found at path:", record.filePath);
        }

        const rawText = `Record Type: ${record.type}\nDate: ${record.createdAt}\nContent/Notes: ${record.summary || "No specific summary provided."}`;

        const prompt = `
        You are a Responsible Medical AI Assistant for HealthHive.
        CONTEXT: ${rawText}
        TASK: Analyze document, generate doctor/patient summaries, extract fields.
        OUTPUT JSON.
        `;

        const parts: any[] = [{ text: prompt }];
        if (filePart) parts.push(filePart);

        console.log("Sending request to Gemini...");

        try {
            const response = await axios.post(url, {
                contents: [{ parts: parts }]
            });
            console.log("✅ Success!");
            console.log("Candidates:", response.data.candidates.length);
        } catch (error: any) {
            console.error("❌ API Call FAILED");
            if (error.response) {
                console.error("Status:", error.response.status);
                // FULL ERROR DETAILS
                console.error("Error Body:", JSON.stringify(error.response.data, null, 2));
            } else {
                console.error(error.message);
            }
        }

        await mongoose.disconnect();

    } catch (e) {
        console.error(e);
    }
};

debugAI();
