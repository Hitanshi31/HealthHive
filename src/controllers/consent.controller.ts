import { Request, Response } from 'express';
import Consent from '../models/Consent';
import User from '../models/User';
import AuditLog from '../models/AuditLog';

// Helper to safely access user from request
const getUser = (req: Request) => (req as any).user;

export const grantConsent = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = getUser(req);
        let { doctorId, validUntil } = req.body;
        let finalDoctorId = doctorId;

        // Resolve Doctor Code (DOC-XXXXX) to User ID if needed
        if (doctorId.startsWith('DOC-')) {
            const doctorUser = await User.findOne({ doctorCode: doctorId });
            if (!doctorUser) {
                res.status(404).json({ error: 'Doctor not found with that ID' });
                return;
            }
            finalDoctorId = doctorUser._id;
        }

        const consent = await Consent.create({
            patientId: user.userId,
            doctorId: finalDoctorId,
            validFrom: new Date(),
            validUntil: new Date(validUntil),
            status: 'ACTIVE'
        });

        await AuditLog.create({
            patientId: user.userId,
            actorId: user.userId,
            action: "GRANT_CONSENT",
            resource: "CONSENT",
            purpose: "PATIENT_REQUEST"
        });

        res.status(201).json(consent);
    } catch (error) {
        console.error("Grant consent error:", error);
        res.status(500).json({ error: 'Granting consent failed' });
    }
};

export const revokeConsent = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = getUser(req);
        const { consentId } = req.params;

        const consent = await Consent.findByIdAndUpdate(
            consentId,
            { status: 'REVOKED' },
            { new: true }
        );

        if (!consent) {
            res.status(404).json({ error: 'Consent not found' });
            return;
        }

        await AuditLog.create({
            patientId: user.userId,
            actorId: user.userId,
            action: "REVOKE_CONSENT",
            resource: "CONSENT",
            purpose: "PATIENT_REQUEST"
        });

        res.json(consent);
    } catch (error) {
        console.error("Revoke consent error:", error);
        res.status(500).json({ error: 'Revocation failed' });
    }
};

export const getConsents = async (req: Request, res: Response): Promise<void> => {
    try {
        const userPayload = getUser(req);
        // Fetch user to match role
        const user = await User.findById(userPayload.userId);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        let consents: any[] = [];
        if (user.role === 'PATIENT') {
            const rawConsents = await Consent.find({ patientId: user._id })
                .populate('doctorId', 'email _id');

            // Map to preserve structure: doctorId (ID) + doctor (Object)
            consents = rawConsents.map(c => {
                const doc = c.doctorId as any;
                return {
                    ...c.toObject(),
                    doctorId: doc._id,
                    doctor: { id: doc._id, email: doc.email }
                };
            });

        } else if (user.role === 'DOCTOR') {
            const rawConsents = await Consent.find({ doctorId: user._id })
                .populate('patientId', 'email _id');

            consents = rawConsents.map(c => {
                const pat = c.patientId as any;
                return {
                    ...c.toObject(),
                    patientId: pat._id,
                    patient: { id: pat._id, email: pat.email }
                };
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
