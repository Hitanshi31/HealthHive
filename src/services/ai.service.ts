import axios from 'axios';
import fs from 'fs';
import path from 'path';
import MedicalRecord, { IMedicalRecord } from '../models/MedicalRecord';
import User from '../models/User';
import mongoose from 'mongoose';

// Using gemini-1.5-flash for speed and efficiency (Updated model name if needed, keeping reliable one)
const GEMINI_MODEL = "gemini-2.0-flash-exp";

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

const sanitizeText = (text: string): string => {
    // Basic PII scrubbing (Mock implementation)
    // In a real HIPAA-compliant system, this would use NLP to entities like Names, SSNs, etc.
    // Here we use regex to mask patterns that look like Phone Numbers or Emails.
    return text
        .replace(/\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g, "[EMAIL_REDACTED]")
        .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE_REDACTED]")
        .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN_REDACTED]");
};

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

        if (record.type === 'PRESCRIPTION' && record.prescription) {
            console.log("Generating deterministic summary for PRESCRIPTION.");
            aiOutput = generatePrescriptionAnalysis(record);
        } else if (apiKey) {
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
            medicationOverlap: detectMedicationOverlap(aiOutput, patientRecords), // New Flag
            relatedRecordIds: findRelatedRecords(aiOutput, patientRecords)
        };

        // New Logic: Update User's Ongoing Medications if medications were extracted
        if (aiOutput.extractedFields?.medications && Array.isArray(aiOutput.extractedFields.medications)) {
            const extractedMeds = aiOutput.extractedFields.medications;

            // 1. Update User Profile (Health Basics)
            await updateUserMedications(record.patientId.toString(), extractedMeds);

            // 2. Populate record.prescription IF it's a PRESCRIPTION type and doesn't have one yet
            // This ensures it shows up in the "Ongoing Medicines" timeline/list
            if (record.type === 'PRESCRIPTION' && !record.prescription) {
                record.prescription = {
                    medicines: extractedMeds.map((m: any) => ({
                        name: m.name || 'Unknown',
                        dosage: m.dosage || 'As prescribed',
                        frequency: m.frequency || 'As directed', // Prompt might not extract this yet
                        duration: m.duration || 'Unknown',
                        startDate: record.createdAt,
                        instructions: 'Extracted from uploaded document'
                    })),
                    doctorId: 'AI_EXTRACTED', // Marker
                    issuedAt: record.createdAt
                };
            }
        }

        // New Local Logic: Freshness & Change Summary
        const freshness = calculateFreshness(record.createdAt);
        const changeSummary = generateChangeSummary(record, patientRecords);


        // 3. Save updates
        record.aiSummary = aiOutput.summary;
        record.aiPatientSummary = aiOutput.patientSummary; // Patient View
        record.aiDoctorNote = aiOutput.structuredSummary?.clinicalNote; // Doctor View
        record.aiStructuredSummary = aiOutput.structuredSummary;
        record.aiContext = {
            freshnessLabel: freshness,
            changeSummary: changeSummary
        };
        record.aiExtractedFields = aiOutput.extractedFields;
        record.aiFlags = flags;

        // Force complete
        record.isComplete = true;

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

        const rawText = `Record Type: ${record.type}\nDate: ${record.createdAt}\nContent/Notes: ${record.summary || "No specific summary provided."}`;
        const sanitizedContext = sanitizeText(rawText);

        const prompt = `
        You are a Responsible Medical AI Assistant for HealthHive.
        
        GOAL: Analyze medical records to provide safety flags and clinical summaries.
        SAFETY: 
        - DO NOT provision medical advice, diagnosis, or treatment plans.
        - DO NOT mention patient names, IDs, or dates of birth (PHI).
        - ALL outputs must be INFORMATIONAL ONLY.
        
        CONTEXT:
        ${sanitizedContext}

        TASK:
        1. **Analyze** the document/image.
        2. **Generate Doctor Summary**:
           - Tone: Clinical, concise, technical.
           - Focus: Abnormalities, key metrics, clinical significance.
        3. **Generate Patient Summary**:
           - Tone: Simple, empathetic, clear (Grade 6 reading level).
           - Focus: "What this means", "Next steps (generic)".
        4. **Extract Structured Data**:
           - Key Findings (Name/Value)
           - Medications (Name, Dosage, Duration)
           - Test Name, Date.

        OUTPUT JSON FORMAT:
        {
          "summary": "Full summary (fallback)",
          "patientSummary": "Simple explanation for the patient...",
          "structuredSummary": {
            "testName": "Exact test name",
            "recordDate": "YYYY-MM-DD",
            "source": "Lab/Hospital Name",
            "keyFindings": [ { "name": "Finding Name", "value": "Value/Result" } ],
            "clinicalNote": "Doctor-facing clinical note..."
          },
          "extractedFields": {
            "testName": "Name of test",
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
            structuredSummary: parsed.structuredSummary,
            extractedFields: parsed.extractedFields || {}
        };

    } catch (error: any) {
        if (error.response) {
            console.error("Gemini API Error Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Gemini API call failed:", error.message);
        }
        return generateMockAnalysis(record);
    }
};

const generatePrescriptionAnalysis = (record: IMedicalRecord): AIOutput => {
    const meds = record.prescription?.medicines || [];
    const medList = meds.map(m => `- ${m.name} (${m.dosage}, ${m.frequency}) for ${m.duration}`).join('\n');

    return {
        summary: `Prescribed Medications:\n${medList}\n\n${DISCLAIMER}`,
        patientSummary: `You have been prescribed the following medications:\n${medList}\nPlease follow the doctor's instructions.`,
        structuredSummary: {
            recordDate: record.createdAt ? new Date(record.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            source: 'Doctor Prescription',
            keyFindings: meds.map(m => ({ name: 'Medication', value: `${m.name} ${m.dosage}` })),
            clinicalNote: `Prescribed ${meds.length} medications.`
        },
        extractedFields: {
            testDate: record.createdAt ? new Date(record.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            medications: meds.map(m => ({
                name: m.name,
                dosage: m.dosage,
                duration: m.duration
            }))
        }
    };
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

const detectMedicationOverlap = (currentAI: AIOutput, history: IMedicalRecord[]): boolean => {
    // Detect if same medication class or name exists in ACTIVE prescriptions (approximate)
    // For now, extending duplicate logic to check simply "overlap" (if any meds exist in recent history)
    // In real system: Check drug classes (e.g. 2 different NSAIDs).
    // Here: Check if ANY med matches name.
    return detectDuplicateMedication(currentAI, history);
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

// Helper to update User's ongoing medications
const updateUserMedications = async (userId: string, newMeds: any[]) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        // healthBasics.currentMedications is a String (comma separated)
        let currentMedsStr = user.healthBasics?.currentMedications || '';

        // Split into array for easier checking
        const existingMedsList = currentMedsStr.split(',').map(m => m.trim()).filter(Boolean);
        const existingMedsSet = new Set(existingMedsList.map(m => m.toLowerCase()));

        let addedCount = 0;

        for (const med of newMeds) {
            // Format: "Name Dosage (Duration)" e.g. "Amoxicillin 500mg (5 days)"
            // If any field is missing, handle gracefully
            const name = med.name || 'Unknown Drug';
            const dosage = med.dosage || '';
            const duration = med.duration ? `(${med.duration})` : '';

            // Construct readable string
            const medEntry = `${name} ${dosage} ${duration}`.replace(/\s+/g, ' ').trim();

            // Prevent strict duplicates (case-insensitive check)
            if (!existingMedsSet.has(medEntry.toLowerCase())) {
                existingMedsList.push(medEntry);
                existingMedsSet.add(medEntry.toLowerCase());
                addedCount++;
            }
        }

        if (addedCount > 0) {
            if (!user.healthBasics) {
                user.healthBasics = {
                    allergies: '',
                    chronicConditions: '',
                    currentMedications: '',
                    bloodGroup: '',
                    dateOfBirth: undefined
                };
            }
            user.healthBasics.currentMedications = existingMedsList.join(', ');

            // Mongoose might not detect deep change in nested object if not reassigned or marked modified
            // But assigning the leaf property usually works. To be safe with Mixed types or if it was just a string field:
            // The schema says healthBasics is an object with typed fields, so strict mode works.

            await user.save();
            console.log(`Updated user ${userId} with ${addedCount} new medications from prescription.`);
        }
    } catch (error) {
        console.error("Failed to update user medications:", error);
    }
};

export default {
    processRecord
};
