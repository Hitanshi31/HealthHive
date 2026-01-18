import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getEmergencyProfile = async (req: Request, res: Response) => {
    const { qrToken } = req.params;

    try {
        const profile = await prisma.emergencyProfile.findUnique({
            where: { qrToken },
            include: { patient: { select: { email: true } } } // minimal info
        });

        if (!profile || new Date() > profile.expiresAt) {
            res.status(404).json({ error: 'Invalid or expired QR token' });
            return;
        }

        // Log Emergency Access
        await prisma.auditLog.create({
            data: {
                patientId: profile.patientId,
                actorId: null, // Anonymous / Paramedic
                action: "VIEW",
                resource: "EMERGENCY_PROFILE",
                purpose: "EMERGENCY",
                details: "Accessed via QR Code"
            }
        });

        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Access failed' });
    }
};
