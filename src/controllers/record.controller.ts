import { Request, Response } from 'express';
import MedicalRecord from '../models/MedicalRecord';
import Consent from '../models/Consent';
import AuditLog from '../models/AuditLog';

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
        const { type, summary, source, isComplete } = req.body;
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
            whereCondition = { patientId: userId };
        } else if (role === 'DOCTOR') {
            const patientId = req.query.patientId as string;

            if (!patientId) {
                res.status(400).json({ error: 'Patient ID is required' });
                return;
            }

            // Verify Consent
            const now = new Date();
            const consent = await Consent.findOne({
                doctorId: userId,
                patientId: patientId,
                status: 'ACTIVE',
                validFrom: { $lte: now },
                validUntil: { $gte: now }
            });

            if (!consent) {
                res.status(403).json({ error: 'Access denied: No active consent found' });
                return;
            }

            whereCondition = { patientId: patientId };

            // Log Doctor Access
            await AuditLog.create({
                patientId: patientId,
                actorId: userId,
                action: "VIEW",
                resource: "RECORD_LIST",
                purpose: "ROUTINE_CARE",
                details: "Doctor viewed patient records"
            });

        } else {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const records = await MedicalRecord.find(whereCondition).sort({ createdAt: -1 });

        const recordsWithTrust = records.map((r: any) => ({
            ...r.toObject(), // Convert Mongoose doc to plain object
            trustIndicator: getTrustIndicator(r)
        }));

        res.json(recordsWithTrust);
    } catch (error) {
        console.error("Error fetching records:", error);
        res.status(500).json({ error: 'Fetch failed' });
    }
};

export default {
    uploadRecord,
    getRecords
};

