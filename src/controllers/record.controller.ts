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
    const req = userRequest as Request & { user: { userId: string; role: string } };

    try {
        const { type, summary, source, isComplete } = req.body;
        // In a real app, we'd handle file upload here (req.file)
        // For now, we simulate a file path
        const filePath = `/uploads/${Date.now()}_mock_file.pdf`;

        const record = await prisma.medicalRecord.create({
            data: {
                patientId: req.user.userId,
                type,
                filePath,
                summary: summary || "AI Summary Pending...",
                source,
                isComplete: Boolean(isComplete),
            },
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
        res.status(500).json({ error: 'Upload failed' });
    }
};

export const getRecords = async (userRequest: Request, res: Response): Promise<void> => {
    const req = userRequest as Request & { user: { userId: string; role: string } };

    try {
        // Doctors can access if they have consent. Implementation of consent check is simplified here for brevity, 
        // but in production, we would query the Consent table.

        const records = await prisma.medicalRecord.findMany({
            where: { patientId: req.user.userId }, // Currently only showing own records for simplicity
        });

        const recordsWithTrust = records.map((r: any) => ({
            ...r,
            trustIndicator: getTrustIndicator(r)
        }));

        res.json(recordsWithTrust);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed' });
    }
};

export default {
    uploadRecord,
    getRecords
};

