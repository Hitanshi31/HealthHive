import { Request, Response } from 'express';
import MedicalRecord from '../models/MedicalRecord';
import Consent from '../models/Consent';
import AuditLog from '../models/AuditLog';
import AIService from '../services/ai.service';

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

        // 5) TRIGGER AI SERVICE (Non-blocking / Background)
        // We do NOT await this. It runs in the background.
        AIService.processRecord(record.id).catch(err => {
            console.error(`Failed to trigger AI for record ${record.id}:`, err);
        });

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

        prescriptions.forEach((p: any) => {
            if (!p.prescription) {
                // Handle file-only uploads (Unprocessed or Manual Files)
                activeMeds.push({
                    name: "Prescription File (Processing)",
                    dosage: "View File",
                    frequency: "Unknown",
                    duration: "Unknown",
                    startDate: p.createdAt,
                    doctorId: p.source || "Uploaded",
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
                }
            });
        });

        res.json(activeMeds);
    } catch (error) {
        console.error('Error fetching ongoing medicines:', error);
        res.status(500).json({ error: 'Failed to fetch medicines' });
    }
};

export default {
    uploadRecord,
    getRecords,
    createPrescription,
    getOngoingMedicines
};

