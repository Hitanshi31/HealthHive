import { Request, Response } from 'express';
import MedicalRecord from '../models/MedicalRecord';
import User from '../models/User';
import Consent from '../models/Consent';
import AuditLog from '../models/AuditLog';
import AIService, { processRecord } from '../services/ai.service';
import path from 'path';
import * as fs from 'fs';

// Helper to determine trust color
const getTrustIndicator = (record: any) => {
    // record.createdAt is a Date object in Mongoose
    const isRecent = new Date().getTime() - new Date(record.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000; // 30 days
    if (record.isComplete && isRecent) return 'GREEN';
    if (record.isComplete && !isRecent) return 'YELLOW';
    return 'RED';
};

const getUser = (req: Request) => (req as any).user;

export const uploadRecord = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = getUser(req);
        const { type, summary, source, isComplete, subjectProfileId } = req.body;
        const file = req.file;

        // 1) NO DATA = NO RECORD
        const hasFile = !!file;
        const hasMetadata = !!(type || summary || source);

        if (!hasFile && !hasMetadata) {
            res.status(400).json({ error: 'No medical data provided' });
            return;
        }

        // 2) ZERO DEFAULTS POLICY
        const recordData: any = {
            patientId: user.userId,
            subjectProfileId: subjectProfileId || null, // Handle Dependent ID or Primary (null)
            isComplete: isComplete === 'true' || isComplete === true,
            source: source || null,
            filePath: null
        };

        if (hasFile) {
            // 3) STRICT INPUT-DRIVEN CREATION (File)
            recordData.filePath = file.path;
            recordData.summary = summary || null; // Strict: Use provided summary or null

            // Strict: Type is required.
            if (!type) {
                res.status(400).json({ error: 'Type is required' });
                return;
            }
            recordData.type = type;
        } else {
            // 3) STRICT INPUT-DRIVEN CREATION (Metadata Only)
            recordData.filePath = null;

            if (!type) {
                res.status(400).json({ error: 'Type is required for manual entries' });
                return;
            }
            recordData.type = type;
            recordData.summary = summary || null;
        }

        // 4) SINGLE INSERT GUARANTEE
        const record = await MedicalRecord.create(recordData);

        // 5) TRIGGER AI SERVICE (Blocking for Prescriptions to ensure rapid UI update, Background for others)
        if (record.type === 'PRESCRIPTION') {
            try {
                await AIService.processRecord(record.id);
            } catch (err) {
                console.error(`Failed to process prescription ${record.id}: `, err);
            }
        } else {
            AIService.processRecord(record.id).catch(err => {
                console.error(`Failed to trigger AI for record ${record.id}: `, err);
            });
        }

        // Log Audit
        await AuditLog.create({
            patientId: user.userId,
            actorId: user.userId,
            action: "UPLOAD",
            resource: "RECORD",
            purpose: "ROUTINE_CARE"
        });

        res.status(201).json(record);
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: 'Upload failed' });
    }
};

export const getRecords = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = getUser(req);
        const { userId, role } = user;
        let whereCondition: any = {};

        if (role === 'PATIENT') {
            const subjectProfileId = req.query.subjectProfileId as string;
            // Primary User (null/undefined) or Dependent (string)
            if (subjectProfileId) {
                whereCondition = { patientId: userId, subjectProfileId: subjectProfileId };
            } else {
                // Explicitly look for null or undefined (Primary Profile)
                whereCondition = { patientId: userId, subjectProfileId: { $in: [null, undefined] } };
            }

        } else if (role === 'DOCTOR') {
            const patientId = req.query.patientId as string;
            const subjectProfileId = req.query.subjectProfileId as string; // Optional: specific dependent

            if (!patientId) {
                res.status(400).json({ error: 'Patient ID is required' });
                return;
            }

            // Verify Consent - STRICT MATCHING
            // If viewing dependent, must have consent for dependent.
            // If viewing primary (no subjectProfileId), must have consent for primary (null).
            const now = new Date();
            const consentQuery: any = {
                doctorId: userId,
                patientId: patientId,
                status: 'ACTIVE',
                validFrom: { $lte: now },
                validUntil: { $gte: now }
            };

            if (subjectProfileId) {
                consentQuery.subjectProfileId = subjectProfileId;
            } else {
                consentQuery.subjectProfileId = { $in: [null, undefined] };
            }

            const consent = await Consent.findOne(consentQuery);

            if (!consent) {
                res.status(403).json({ error: 'Access denied: No active consent found for this profile' });
                return;
            }

            whereCondition = { patientId: patientId };
            if (subjectProfileId) {
                whereCondition.subjectProfileId = subjectProfileId;
            } else {
                whereCondition.subjectProfileId = { $in: [null, undefined] };
            }

            // Log Doctor Access
            await AuditLog.create({
                patientId: patientId,
                actorId: userId,
                action: "VIEW",
                resource: "MEDICAL_RECORD",
                purpose: "CONSENTED_ACCESS"
            });
        } else {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const records = await MedicalRecord.find(whereCondition).sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        console.error("Error fetching records:", error);
        res.status(500).json({ error: 'Fetch failed' });
    }
};

export const createPrescription = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = getUser(req);
        const { patientId, subjectProfileId, medicines, instructions } = req.body;

        if (user.role !== 'DOCTOR') {
            res.status(403).json({ error: 'Only doctors can prescribe medication' });
            return;
        }

        if (!patientId || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
            res.status(400).json({ error: 'Patient ID and Medicines list are required' });
            return;
        }

        // Verify Consent
        const now = new Date();
        const consentQuery: any = {
            doctorId: user.userId,
            patientId: patientId,
            status: 'ACTIVE',
            validFrom: { $lte: now },
            validUntil: { $gte: now }
        };

        if (subjectProfileId) {
            consentQuery.subjectProfileId = subjectProfileId;
        } else {
            consentQuery.subjectProfileId = { $in: [null, undefined] };
        }

        const consent = await Consent.findOne(consentQuery);

        if (!consent) {
            res.status(403).json({ error: 'Access denied: No active consent found to prescribe for this profile' });
            return;
        }

        const newRecord = await MedicalRecord.create({
            patientId: patientId,
            subjectProfileId: subjectProfileId || null,
            type: 'PRESCRIPTION',
            isComplete: true,
            source: 'Doctor Prescription',
            prescription: {
                medicines: medicines.map((m: any) => ({
                    ...m,
                    startDate: new Date()
                })),
                doctorId: user.userId,
                issuedAt: now
            }
        });

        // Trigger AI Processing
        AIService.processRecord(newRecord.id).catch(err => console.error("AI Trigger Failed", err));

        res.status(201).json(newRecord);

    } catch (error) {
        console.error('Error creating prescription:', error);
        res.status(500).json({ error: 'Failed to create prescription' });
    }
};

export const getOngoingMedicines = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = getUser(req);
        const { targetPatientId, subjectProfileId } = req.query; // 'targetPatientId' if DOCTOR viewing

        let patientId = user.userId;
        let querySubjectProfileId: any = subjectProfileId;

        // Determine Context
        if (user.role === 'DOCTOR') {
            if (!targetPatientId) {
                res.status(400).json({ error: 'Target Patient ID required for doctors' });
                return;
            }
            patientId = targetPatientId as string;

            // Verify Consent
            const now = new Date();
            const consentQuery: any = {
                doctorId: user.userId,
                patientId: patientId,
                status: 'ACTIVE',
                validFrom: { $lte: now },
                validUntil: { $gte: now }
            };

            if (querySubjectProfileId) {
                consentQuery.subjectProfileId = querySubjectProfileId;
            } else {
                consentQuery.subjectProfileId = { $in: [null, undefined] };
            }

            const consent = await Consent.findOne(consentQuery);
            if (!consent) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
        }

        const query: any = {
            patientId: patientId,
            type: 'PRESCRIPTION'
        };

        if (querySubjectProfileId) {
            query.subjectProfileId = querySubjectProfileId;
        } else {
            query.subjectProfileId = { $in: [null, undefined] };
        }

        const prescriptions = await MedicalRecord.find(query).lean();

        const today = new Date();
        const activeMeds: any[] = [];
        const pastMeds: any[] = [];

        prescriptions.forEach((p: any) => {
            if (!p.prescription) {
                // Determine status: "Processing" or "Processed (No structured data)"
                const isProcessing = !(p.isComplete);

                activeMeds.push({
                    name: isProcessing ? "Prescription File (Processing)" : "Prescription Document",
                    dosage: isProcessing ? "AI Analysis in Progress..." : "View Document",
                    frequency: "Unknown",
                    duration: "Unknown",
                    startDate: p.createdAt,
                    doctorId: p.source || (isProcessing ? "System" : "Uploaded"),
                    recordId: p._id,
                    isFile: true, // Marker for frontend
                    filePath: p.filePath
                });
                return;
            }

            p.prescription.medicines.forEach((m: any) => {
                const expiry = new Date(p.prescription!.issuedAt);
                const durNum = parseInt(m.duration) || 7;
                if (m.duration.toLowerCase().includes('month')) expiry.setMonth(expiry.getMonth() + durNum);
                else expiry.setDate(expiry.getDate() + durNum);

                if (expiry >= today) {
                    activeMeds.push({
                        ...m,
                        doctorId: p.prescription!.doctorId,
                        issuedAt: p.prescription!.issuedAt,
                        recordId: p._id
                    });
                } else {
                    pastMeds.push({
                        ...m,
                        doctorId: p.prescription!.doctorId,
                        issuedAt: p.prescription!.issuedAt,
                        recordId: p._id,
                        expiryDate: expiry
                    });
                }
            });
        });

        // 4. Also fetch manually entered medications from User Profile
        // This ensures that even if no prescription record exists (e.g. self-reported), it shows up.
        // Also helps if AI updated the profile but record.prescription logic was skipped/failed.
        const userProfile = await User.findById(patientId);
        if (userProfile && userProfile.healthBasics && userProfile.healthBasics.currentMedications) {
            const manualMeds = userProfile.healthBasics.currentMedications.split(',').map(s => s.trim()).filter(Boolean);
            manualMeds.forEach(medStr => {
                // Check if this string is already in activeMeds (approximate fuzzy match)
                const alreadyExists = activeMeds.some(am =>
                    medStr.toLowerCase().includes(am.name.toLowerCase()) ||
                    am.name.toLowerCase().includes(medStr.toLowerCase())
                );

                if (!alreadyExists) {
                    activeMeds.push({
                        name: medStr, // Full string as name since it's unstructured
                        dosage: 'Self-reported', // Marker
                        frequency: 'As needed',
                        duration: 'Ongoing',
                        startDate: userProfile.createdAt || new Date(),
                        doctorId: 'Self-reported',
                        recordId: 'profile-' + Math.random().toString(36).substr(2, 9),
                        isManual: true
                    });
                }
            });
        }

        res.json({ active: activeMeds, past: pastMeds });
    } catch (error) {
        console.error('Error fetching ongoing medicines:', error);
        res.status(500).json({ error: 'Failed to fetch medicines' });
    }
};

export const deleteRecord = async (req: Request, res: Response): Promise<void> => {
    console.log(`[DELETE] Request received for ID: ${req.params.id} `);
    try {
        const user = getUser(req);
        const { id } = req.params;
        const userId = user.userId;
        console.log(`[DELETE] User: ${userId}, Record ID: ${id} `);

        const record = await MedicalRecord.findById(id);

        if (!record) {
            console.log(`[DELETE] Record not found`);
            res.status(404).json({ error: 'Record not found' });
            return;
        }

        // Only owner can delete
        if (record.patientId.toString() !== user.userId.toString()) {
            console.log(`[DELETE] Unauthorized access by user ${userId} for record owned by ${record.patientId} `);
            res.status(403).json({ error: 'Unauthorized to delete this record' });
            return;
        }

        console.log(`[DELETE] Record found.FilePath: ${record.filePath} `);

        // 1. Delete File if exists
        if (record.filePath) {
            const fs = require('fs');
            const fullPath = path.join(process.cwd(), record.filePath);
            // Check if file exists before trying to unlink to avoid crashes
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`[DELETE] File deleted: ${fullPath} `);
            } else {
                console.warn(`[DELETE] File not found on disk: ${fullPath} `);
            }
        }

        // 2. Delete Record DB Entry
        await MedicalRecord.deleteOne({ _id: id });
        console.log(`[DELETE] Database entry deleted`);

        // 3. Log Audit
        try {
            await AuditLog.create({
                patientId: user.userId,
                actorId: user.userId,
                action: 'DELETE',
                resource: 'RECORD',
                purpose: 'User Action',
                details: `Deleted record ${id} `
            });
        } catch (logInitError) {
            console.error("[DELETE] Failed to create audit log", logInitError);
        }

        res.json({ message: 'Record deleted successfully' });
    } catch (e) {
        console.error('[DELETE] Error deleting record:', e);
        res.status(500).json({ error: 'Delete failed' });
    }
};


export const retryAIProcessing = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = getUser(req);

        // Ensure patient owns the record
        const record = await MedicalRecord.findOne({ _id: id, patientId: user.userId });

        if (!record) {
            res.status(404).json({ message: 'Record not found' });
            return;
        }

        // Reset to pending so frontend shows spinner immediately
        record.aiStatus = 'PENDING';
        await record.save();

        // Trigger AI service
        processRecord(id).catch(err => console.error("Retry background process failed", err));

        res.status(200).json({ message: 'AI Processing execution started.', record });
    } catch (error) {
        console.error('Error retrying AI:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export default {
    uploadRecord,
    getRecords,
    createPrescription,
    getOngoingMedicines,
    deleteRecord,
    retryAIProcessing // Export new method
};

