import axios from 'axios';
import fs from 'fs';
import path from 'path';
import MedicalRecord, { IMedicalRecord } from '../models/MedicalRecord';
import mongoose from 'mongoose';

// Using gemini-1.5-flash for speed and efficiency
const GEMINI_MODEL = "gemini-2.5-flash-lite";

interface AIOutput {
    summary: string;
    patientSummary: string; // New field
    structuredSummary?: { // New structured type
        testName?: string;
        recordDate?: string;
        source?: string;
        keyFindings?: { name: string; value: string }[];
        clinicalNote?: string;
    };
    extractedFields: {
        testName?: string;
        testDate?: string;
        medications?: { name: string; dosage: string; duration: string }[];
        [key: string]: any;
    };
}

const DISCLAIMER = "AI insights are informational only and do not replace medical judgment.";

export const processRecord = async (recordId: string): Promise<void> => {
    try {
        console.log(`Starting AI processing for record: ${recordId}`);
        const record = await MedicalRecord.findById(recordId);
        if (!record) {
            console.error("Record not found for AI processing");
            return;
        }

        // 1. AI Processing (LLM)
        let aiOutput: AIOutput;
        const apiKey = process.env.GEMINI_API_KEY;

        if (apiKey) {
            aiOutput = await generateAIAnalysis(record, apiKey);
        } else {
            console.log("No GEMINI_API_KEY found. Using mock AI response.");
            aiOutput = generateMockAnalysis(record);
        }

        // Append disclaimer to summary if not present (though prompt should handle it, we enforce it)
        if (!aiOutput.summary.includes(DISCLAIMER)) {
            aiOutput.summary += `\n\n${DISCLAIMER}`;
        }

        // 2. Local Logic (Duplicates & Overlap)
        // Fetch recent records for the same patient
        const patientRecords = await MedicalRecord.find({
            patientId: record.patientId,
            _id: { $ne: record._id } // Exclude current
        }).sort({ createdAt: -1 }).limit(20); // Limit to recent 20 for performance

        const flags = {
            duplicateTest: detectDuplicateTest(aiOutput, patientRecords),
            duplicateMedication: detectDuplicateMedication(aiOutput, patientRecords),
            relatedRecordIds: findRelatedRecords(aiOutput, patientRecords)
        };

        // New Local Logic: Freshness & Change Summary
        const freshness = calculateFreshness(record.createdAt);
        const changeSummary = generateChangeSummary(record, patientRecords);


        // 3. Save updates
        record.aiSummary = aiOutput.summary;
        record.aiPatientSummary = aiOutput.patientSummary;
        record.aiDoctorNote = aiOutput.structuredSummary?.clinicalNote; // Map clinical note
        record.aiStructuredSummary = aiOutput.structuredSummary;
        record.aiContext = {
            freshnessLabel: freshness,
            changeSummary: changeSummary
        };
        record.aiExtractedFields = aiOutput.extractedFields;
        record.aiFlags = flags;

        await record.save();
        console.log(`AI Processing completed successfully for record ${recordId}`);

    } catch (error) {
        console.error(`AI Processing failed for record ${recordId}:`, error);
        // Fail silently so as not to block the user flow
    }
};

const generateAIAnalysis = async (record: IMedicalRecord, apiKey: string): Promise<AIOutput> => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

        let filePart = null;
        if (record.filePath && fs.existsSync(record.filePath)) {
            const fileData = fs.readFileSync(record.filePath);
            const base64Data = fileData.toString('base64');
            const ext = path.extname(record.filePath).toLowerCase();
            let mimeType = 'application/pdf'; // default
            if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
            if (ext === '.png') mimeType = 'image/png';

            filePart = {
                inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                }
            };
        }

        const inputText = `Record Type: ${record.type}\nDate: ${record.createdAt}\nContent/Notes: ${record.summary || "No specific summary provided."}`;

        const prompt = `
        You are a generic medical assistant AI. Your task is to analyze the attached medical record document and metadata to generate summaries.
        
        METADATA:
        ${inputText}

        INSTRUCTIONS:
        1. Analyze the ATTACHED DOCUMENT image/PDF to understand the medical details.
        2. **SUMMARY GOAL (CLINICAL)**: Generate a STRUCTURED output suitable for a medical professional.
           - **CRITICAL**: DO NOT mention Patient Name, Age, ID, or Date in the notes.
           - Extract **Key Findings** as name-value pairs (e.g., "Hemoglobin": "12.5 g/dL").
           - Write a **Clinical Note** that is concise, factual, and highlights abnormalities.
        
        3. **SUMMARY GOAL (PATIENT-FRIENDLY)**: Generate a separate simplified summary for the patient.
           - Use simple language.
           - Explain context and results broadly.

        4. Extract key structured data: test names, dates, key findings, and medications.
        5. BE NEUTRAL and FACTUAL. DO NOT diagnose or recommend treatment.
        6. Output JSON ONLY in the following format:
        {
          "summary": "Full clinical summary text (fallback)",
          "patientSummary": "Patient-friendly summary here...",
          "structuredSummary": {
            "testName": "Exact test name",
            "recordDate": "YYYY-MM-DD",
            "source": "Lab/Hospital Name",
            "keyFindings": [
              { "name": "Finding Name", "value": "Value/Result" }
            ],
            "clinicalNote": "Concise clinical note text."
          },
          "extractedFields": {
            "testName": "Name of test if applicable",
            "testDate": "YYYY-MM-DD",
            "medications": [{ "name": "Drug Name", "dosage": "Dosage", "duration": "Duration" }]
          }
        }
        `;

        const parts: any[] = [{ text: prompt }];
        if (filePart) {
            parts.push(filePart);
        }

        const response = await axios.post(url, {
            contents: [{
                parts: parts
            }]
        });

        const candidates = response.data?.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error("No response from Gemini");
        }

        const textResponse = candidates[0].content.parts[0].text;

        // Robust JSON extraction
        let jsonString = textResponse;
        const firstOpen = textResponse.indexOf('{');
        const lastClose = textResponse.lastIndexOf('}');

        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
            jsonString = textResponse.substring(firstOpen, lastClose + 1);
        }

        const parsed = JSON.parse(jsonString);

        return {
            summary: parsed.summary || "AI could not generate a summary.",
            patientSummary: parsed.patientSummary || "AI could not generate a patient summary.",
            structuredSummary: parsed.structuredSummary, // New field
            extractedFields: parsed.extractedFields || {}
        };

    } catch (error: any) {
        if (error.response) {
            console.error("Gemini API Error Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Gemini API call failed:", error.message);
        }
        return generateMockAnalysis(record); // Fallback to mock on error
    }
};

const generateMockAnalysis = (record: IMedicalRecord): AIOutput => {
    return {
        summary: `[MOCK AI] This appears to be a ${record.type} record from ${record.source || 'unknown source'}. No detailed analysis available without API key. ${DISCLAIMER}`,
        patientSummary: `[MOCK AI] This is a placeholder summary for the patient.`,
        extractedFields: {
            mockData: true,
            note: "This is placeholder data."
        }
    };
};

// --- Local Logic Helpers ---

const calculateFreshness = (dateArg: Date | string): 'RECENT' | 'OLD' | 'OUTDATED' => {
    const date = new Date(dateArg);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) return 'RECENT';
    if (diffDays <= 180) return 'OLD';
    return 'OUTDATED';
};

const generateChangeSummary = (current: IMedicalRecord, history: IMedicalRecord[]): string => {
    if (!history || history.length === 0) {
        return "First record added.";
    }

    const prev = history[0]; // Using the most recent previous record
    const typeChanged = prev.type !== current.type;

    // Simple logic: just mention if a new type of record is added
    if (typeChanged) {
        return `New ${current.type.replace('_', ' ')} record added since previous ${prev.type.replace('_', ' ')}.`;
    }

    return "No significant change in record type since last visit.";
};


const detectDuplicateTest = (currentAI: AIOutput, history: IMedicalRecord[]): boolean => {
    const currentTest = currentAI.extractedFields?.testName?.toLowerCase();
    if (!currentTest) return false;

    // Check history for same test name in extracted fields
    return history.some(prev => {
        const prevTest = prev.aiExtractedFields?.testName?.toLowerCase();
        // Check if within 30 days (example logic)
        // In real app, check dates. Here we just simple string match on recent records.
        return prevTest === currentTest;
    });
};

const detectDuplicateMedication = (currentAI: AIOutput, history: IMedicalRecord[]): boolean => {
    const currentMeds = currentAI.extractedFields?.medications as any[];
    if (!currentMeds || !Array.isArray(currentMeds) || currentMeds.length === 0) return false;

    const currentMedNames = new Set(currentMeds.map(m => m.name?.toLowerCase()));

    return history.some(prev => {
        const prevMeds = prev.aiExtractedFields?.medications as any[];
        if (!prevMeds || !Array.isArray(prevMeds)) return false;

        return prevMeds.some(pm => currentMedNames.has(pm.name?.toLowerCase()));
    });
};

const findRelatedRecords = (currentAI: AIOutput, history: IMedicalRecord[]): mongoose.Types.ObjectId[] => {
    const relatedIds: mongoose.Types.ObjectId[] = [];
    const currentTest = currentAI.extractedFields?.testName?.toLowerCase();

    history.forEach(prev => {
        const prevTest = prev.aiExtractedFields?.testName?.toLowerCase();
        if (currentTest && prevTest === currentTest) {
            relatedIds.push(prev._id as mongoose.Types.ObjectId);
        }
    });
    return relatedIds;
};

export default {
    processRecord
};
