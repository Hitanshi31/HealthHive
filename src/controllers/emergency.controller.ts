import { Request, Response } from 'express';
import EmergencyProfile from '../models/EmergencyProfile';
import AuditLog from '../models/AuditLog';

// Helper to safely access user from request
const getUser = (req: Request) => (req as any).user;

export const getEmergencyProfile = async (req: Request, res: Response) => {
    const { qrToken } = req.params;

    try {
        const profile = await EmergencyProfile.findOne({ token: qrToken })
            .populate('patientId', 'email'); // Populate patient email

        if (!profile || new Date() > profile.expiresAt) {
            res.status(404).json({ error: 'Invalid or expired QR token' });
            return;
        }

        const response = {
            ...profile.toObject(),
            patientId: (profile.patientId as any)._id,
            subjectProfileId: profile.subjectProfileId || null,
            patient: {
                email: (profile.patientId as any).email
            }
        };

        // Log Emergency Access
        await AuditLog.create({
            patientId: (profile.patientId as any)._id,
            actorId: "System",
            action: "VIEW",
            resource: "EMERGENCY_PROFILE",
            purpose: "EMERGENCY",
            details: "Accessed via QR Code"
        });

        res.json(response);
    } catch (error) {
        console.error("Emergency access failed:", error);
        res.status(500).json({ error: 'Access failed' });
    }
};

export const generateQR = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = getUser(req);
        if (user.role !== 'PATIENT') {
            res.status(403).json({ error: 'Only patients can generate emergency QR codes' });
            return;
        }

        const { subjectProfileId } = req.body;

        // Generate a random token
        const qrToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        // Set expiration to 24 hours from now
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Update or Create the profile with the new token
        // Key is (patientId + subjectProfileId)
        const filter = {
            patientId: user.userId,
            subjectProfileId: subjectProfileId || null
        };

        try {
            const profile = await EmergencyProfile.findOneAndUpdate(
                filter,
                {
                    patientId: user.userId,
                    subjectProfileId: subjectProfileId || null,
                    token: qrToken,
                    expiresAt,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            res.status(201).json({ qrToken, expiresAt, message: "Emergency QR generated successfully" });
        } catch (dbError: any) {
            console.error("DB Error:", dbError);
            res.status(500).json({ error: 'Failed to generate QR.' });
        }

    } catch (error) {
        console.error("QR Generation Error:", error);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
};
