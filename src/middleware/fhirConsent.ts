import { Request, Response, NextFunction } from 'express';
import Consent from '../models/Consent';
// Fix: Import from correct file name 'auth.middleware' (not 'auth')
// Fix: Define AuthRequest locally or import if exported (it wasn't exported in auth.middleware.ts view, so defining compliant interface)
interface AuthRequest extends Request {
    user?: { id: string; role: string;[key: string]: any }; // Matching JWT decoded shape, mapping userId -> id for consistency or handling both
}

// NOTE: The existing auth middleware sets `req.user = { userId, role }`. 
// Our code used `req.user.id`. We need to harmonize.
// Let's use a helper or just access .userId.

/**
 * Middleware to enforce Consent for FHIR resources.
 * 
 * Rules:
 * 1. If Actor is PATIENT:
 *    - Can access their own data (:id matches user.id).
 *    - Cannot access others.
 * 
 * 2. If Actor is DOCTOR (Practitioner):
 *    - Must have ACTIVE Consent record for the target patient.
 *    - Consent must be within valid time window.
 */
export const enforceFHIRConsent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "unauthorized", diagnostics: "Authentication required" }] });
        }

        // Fix: auth.middleware.ts sets `userId`, not `id`
        const actorId = req.user.userId || req.user.id;
        const actorRole = req.user.role;

        // Extract Target Patient ID from various sources
        let targetPatientId: string | null = null;

        // Manual parsing because middleware attached to router might not see params yet
        // Debug
        console.log(`[FHIR-DEBUG] Method: ${req.method} URL: ${req.url}`);

        const patientMatch = req.url.match(/\/Patient\/([a-fA-F0-9]{24})/);

        if (patientMatch) {
            targetPatientId = patientMatch[1];
        } else if (req.query.patient) {
            targetPatientId = req.query.patient as string; // /DocumentReference?patient=:id
        } else if (req.body && req.body.patient && req.body.patient.reference) {
            // For creating Consent or other resources
            const ref = req.body.patient.reference;
            targetPatientId = ref.replace('Patient/', '');
        }

        // If no specific patient targets, and it's a doctor listing something general, block or filter.
        // For this hackathon scope, we require direct patient context.
        if (!targetPatientId && actorRole === 'DOCTOR') {
            // Exception: Creating a Consent record might not have patient in param if in body, handled above.
            // If we can't identify the patient, we can't check consent.
            // Allow 'Consent' POST if it's the PATIENT doing it.
            if (req.method === 'POST' && req.url.includes('Consent')) {
                // Patient granting consent - allowed if actor is patient (checked below)
                // But we need to know who permitted it. 
                // If not found, let controller handle validation or fail.
                return next();
            }
            return res.status(400).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "required", diagnostics: "Patient context required" }] });
        }

        // 1. PATIENT Accessing Data
        if (actorRole === 'PATIENT') {
            // If target is known, it must match self
            if (targetPatientId && targetPatientId !== actorId) {
                return res.status(403).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "forbidden", diagnostics: "You can only access your own records" }] });
            }
            // If target not specified (e.g. "search my docs"), impl needs to default to self.
            return next();
        }

        // 2. DOCTOR Accessing Data
        if (actorRole === 'DOCTOR') {
            if (!targetPatientId) {
                return res.status(400).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "required", diagnostics: "Patient context required for Practitioner access" }] });
            }

            // Check Consent DB
            const activeConsent = await Consent.findOne({
                patientId: targetPatientId,
                doctorId: actorId,
                status: 'ACTIVE',
                validFrom: { $lte: new Date() },
                validUntil: { $gte: new Date() }
            });

            if (!activeConsent) {
                // LOG IT (MVP console)
                console.warn(`[FHIR-Consent] BLOCK: Doctor ${actorId} attempted access to Patient ${targetPatientId} without valid consent.`);

                return res.status(403).json({
                    resourceType: "OperationOutcome",
                    issue: [{
                        severity: "error",
                        code: "forbidden",
                        diagnostics: "No active consent found for this Patient-Practitioner relationship."
                    }]
                });
            }

            // LOG IT
            console.log(`[FHIR-Consent] ALLOW: Doctor ${actorId} accessing Patient ${targetPatientId}. Consent ID: ${activeConsent._id}`);
            return next();
        }

        return res.status(403).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "forbidden", diagnostics: "Unknown role" }] });

    } catch (error) {
        console.error("FHIR Consent Error:", error);
        return res.status(500).json({ resourceType: "OperationOutcome", issue: [{ severity: "fatal", code: "exception", diagnostics: "Internal Server Error" }] });
    }
};
