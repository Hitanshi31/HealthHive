import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const grantConsent = async (userRequest: Request, res: Response): Promise<void> => { // Explicitly return void
    const req = userRequest as Request & { user: { userId: string } };
    try {
        const { doctorId, validUntil } = req.body;

        // Validate that doctor exists and is a doctor (omitted for brevity)

        const consent = await prisma.consent.create({
            data: {
                patientId: req.user.userId,
                doctorId,
                validFrom: new Date(),
                validUntil: new Date(validUntil),
                status: 'ACTIVE'
            }
        });

        await prisma.auditLog.create({
            data: {
                patientId: req.user.userId,
                actorId: req.user.userId,
                action: "GRANT_CONSENT",
                resource: "CONSENT",
                purpose: "PATIENT_REQUEST"
            }
        });

        res.status(201).json(consent);
    } catch (error) {
        res.status(500).json({ error: 'Granting consent failed' });
    }
};

export const revokeConsent = async (userRequest: Request, res: Response): Promise<void> => { // Explicitly return void
    const req = userRequest as Request & { user: { userId: string } };
    try {
        const { consentId } = req.params;

        const consent = await prisma.consent.update({
            where: { id: consentId },
            data: { status: 'REVOKED' }
        });

        await prisma.auditLog.create({
            data: {
                patientId: req.user.userId, // Assuming patient is revoking
                actorId: req.user.userId,
                action: "REVOKE_CONSENT",
                resource: "CONSENT",
                purpose: "PATIENT_REQUEST"
            }
        });

        res.json(consent);
    } catch (error) {
        res.status(500).json({ error: 'Revocation failed' });
    }
};

export const getConsents = async (userRequest: Request, res: Response): Promise<void> => {
    const req = userRequest as Request & { user: { userId: string } };
    try {
        // Fetch user to match role
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        let consents: any[] = [];
        if (user.role === 'PATIENT') {
            consents = await prisma.consent.findMany({
                where: { patientId: user.id },
                include: { doctor: { select: { email: true, id: true } } }
            });
        } else if (user.role === 'DOCTOR') {
            consents = await prisma.consent.findMany({
                where: { doctorId: user.id },
                include: { patient: { select: { email: true, id: true } } }
            });
        } else {
            consents = [];
        }

        res.json(consents);
    } catch (error) {
        console.error("Error fetching consents:", error);
        res.status(500).json({ error: 'Failed to fetch consents' });
    }
};
