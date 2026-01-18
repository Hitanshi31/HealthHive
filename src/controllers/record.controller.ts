import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to determine trust color
const getTrustIndicator = (record: any) => {
    const isRecent = new Date().getTime() - new Date(record.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000; // 30 days
    if (record.isComplete && isRecent) return 'GREEN';
    if (record.isComplete && !isRecent) return 'YELLOW';
    return 'RED';
};

export const uploadRecord = async (userRequest: Request, res: Response): Promise<void> => {
    const req = userRequest as Request & { user: { userId: string; role: string }, file?: any };

    try {
        const { type, summary, source, isComplete } = req.body;
        const file = req.file;

        // 1) NO DATA = NO RECORD
        // Request must include at least ONE of: Uploaded file OR explicit metadata
        const hasFile = !!file;
        const hasMetadata = !!(type || summary || source);

        if (!hasFile && !hasMetadata) {
            res.status(400).json({ error: 'No medical data provided' });
            return;
        }

        // 2) ZERO DEFAULTS POLICY
        // Initialize with strict defaults (mostly null/false)
        let recordData: any = {
            patientId: req.user.userId,
            // Do NOT default isComplete to true. Use user input or false.
            isComplete: isComplete === 'true' || isComplete === true,
            source: source || null, // No default lab names
        };

        // Explicitly set filePath to null if no file, though let recordData handle it.
        recordData.filePath = null;

        if (hasFile) {
            // 3) STRICT INPUT-DRIVEN CREATION (File)
            recordData.filePath = file.path;

            // Strict: Use provided summary or null. No defaults.
            recordData.summary = summary || null;

            // Strict: Type is required. No "DOCUMENT" default.
            if (!type) {
                res.status(400).json({ error: 'Type is required' });
                return;
            }
            recordData.type = type;
        } else {
            // 3) STRICT INPUT-DRIVEN CREATION (Metadata Only)
            // Use PROVIDED values only. No file path.
            recordData.filePath = null; // STRICT: Nullable in schema

            // Type is mandatory for manual entry
            if (!type) {
                res.status(400).json({ error: 'Type is required for manual entries' });
                return;
            }
            recordData.type = type;
            recordData.summary = summary || null; // No auto-fill
        }

        // 4) SINGLE INSERT GUARANTEE
        // Create exactly ONE record.
        const record = await prisma.medicalRecord.create({
            data: recordData,
        });

        // Log Audit
        await prisma.auditLog.create({
            data: {
                patientId: req.user.userId,
                actorId: req.user.userId,
                action: "UPLOAD",
                resource: "RECORD",
                purpose: "ROUTINE_CARE"
            }
        });

        res.status(201).json(record);
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: 'Upload failed' });
    }
};

export const getRecords = async (userRequest: Request, res: Response): Promise<void> => {
    const req = userRequest as Request & { user: { userId: string; role: string } };

    try {
        const { userId, role } = req.user;
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
            const consent = await prisma.consent.findFirst({
                where: {
                    doctorId: userId,
                    patientId: patientId,
                    status: 'ACTIVE',
                    validFrom: { lte: new Date() },
                    validUntil: { gte: new Date() }
                }
            });

            if (!consent) {
                res.status(403).json({ error: 'Access denied: No active consent found' });
                return;
            }

            whereCondition = { patientId: patientId };

            // Log Doctor Access
            await prisma.auditLog.create({
                data: {
                    patientId: patientId,
                    actorId: userId,
                    action: "VIEW",
                    resource: "RECORD_LIST",
                    purpose: "ROUTINE_CARE",
                    details: "Doctor viewed patient records"
                }
            });

        } else {
            // Fallback for other roles or unauthorized
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const records = await prisma.medicalRecord.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' }
        });

        const recordsWithTrust = records.map((r: any) => ({
            ...r,
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

