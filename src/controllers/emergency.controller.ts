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

export const generateQR = async (userRequest: Request, res: Response): Promise<void> => {
    const req = userRequest as Request & { user: { userId: string; role: string } };

    try {
        if (req.user.role !== 'PATIENT') {
            res.status(403).json({ error: 'Only patients can generate emergency QR codes' });
            return;
        }

        // Generate a random token
        const qrToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        // Set expiration to 24 hours from now
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Update or Create the profile with the new token
        try {
            const profile = await prisma.emergencyProfile.upsert({
                where: { patientId: req.user.userId },
                update: {
                    qrToken,
                    expiresAt
                },
                create: {
                    patientId: req.user.userId,
                    qrToken,
                    expiresAt,
                    bloodGroup: 'Not Specified',
                    allergies: 'None',
                    chronicConditions: 'None',
                    activeMedications: 'None'
                }
            });
            res.status(201).json({ qrToken, expiresAt, message: "Emergency QR generated successfully" });
        } catch (dbError: any) {
            console.error("DB Error:", dbError);
            res.status(500).json({ error: 'Failed to generate QR. Ensure profile exists or schema support.' });
        }

    } catch (error) {
        console.error("QR Generation Error:", error);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
};
