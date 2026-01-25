import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import MedicalRecord, { IMedicalRecord } from '../models/MedicalRecord';
import Consent, { IConsent } from '../models/Consent';
// Fix: Import from auth.middleware and define AuthRequest
// import { AuthRequest } from '../middleware/auth'; 
interface AuthRequest extends Request {
    user?: { userId: string; role: string;[key: string]: any };
}
import { FHIRPatient, FHIRDocumentReference, FHIRConsent } from '../fhir/types';
import mongoose from 'mongoose';

// --- MAPPERS ---

const mapUserToFHIRPatient = (user: IUser): FHIRPatient => {
    return {
        resourceType: 'Patient',
        id: (user._id as unknown) as string,
        active: true,
        identifier: [
            { system: 'https://healthhive.app/ids/patient', value: user.patientCode || 'UNKNOWN' }
        ],
        name: [
            { use: 'official', text: user.email } // Using email as name for MVP if name missing
        ]
    };
};

const mapRecordToFHIRDocRef = (record: IMedicalRecord): FHIRDocumentReference => {
    return {
        resourceType: 'DocumentReference',
        id: (record._id as unknown) as string,
        status: 'current',
        docStatus: 'final',
        date: record.createdAt.toISOString(),
        subject: {
            reference: `Patient/${record.patientId}`
        },
        type: {
            text: record.type
        },
        content: [
            {
                attachment: {
                    url: record.filePath, // direct path/url
                    contentType: 'application/pdf', // assuming mostly PDF/images
                    title: record.summary || record.type
                }
            }
        ]
    };
};

const mapConsentToFHIR = (consent: IConsent): FHIRConsent => {
    return {
        resourceType: 'Consent',
        id: (consent._id as unknown) as string,
        status: consent.status === 'ACTIVE' ? 'active' : 'inactive',
        scope: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy', display: 'Privacy Consent' }]
        },
        category: [{
            coding: [{ system: 'http://loinc.org', code: '59284-0', display: 'Consent Document' }]
        }],
        patient: {
            reference: `Patient/${consent.patientId}`
        },
        provision: {
            type: 'permit',
            period: {
                start: consent.validFrom.toISOString(),
                end: consent.validUntil.toISOString()
            },
            actor: [
                {
                    role: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType', code: 'PRCP', display: 'Primary Recipient' }] },
                    reference: { reference: `Practitioner/${consent.doctorId}` }
                }
            ]
        }
    };
};

// --- HANDLERS ---

export const getPatient = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user || user.role !== 'PATIENT') {
            return res.status(404).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "not-found", diagnostics: "Patient not found" }] });
        }

        const fhirPatient = mapUserToFHIRPatient(user);
        res.status(200).json(fhirPatient);
    } catch (error) {
        console.error("Get Patient Error:", error);
        res.status(500).json({ resourceType: "OperationOutcome", issue: [{ severity: "fatal", code: "exception" }] });
    }
};

export const getDocumentReferences = async (req: AuthRequest, res: Response) => {
    try {
        const patientId = req.query.patient as string;

        // Consent middleware already validated access to this patientId if user is Doctor.
        // If user is Patient, they can only request themselves. 
        if (req.user?.role === 'PATIENT' && req.user.userId !== patientId) {
            // Fallback check if middleware didn't catch query param mismatch or implicit
            return res.status(403).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "forbidden" }] });
        }

        const records = await MedicalRecord.find({ patientId });

        // Return a Bundle (simplifying to List for minimal scope, or just array wrapped)
        // Standard FHIR search returns a Bundle.
        const entry = records.map(r => ({
            resource: mapRecordToFHIRDocRef(r)
        }));

        const bundle = {
            resourceType: 'Bundle',
            type: 'searchset',
            total: records.length,
            entry
        };

        res.status(200).json(bundle);
    } catch (error) {
        console.error("Get Docs Error:", error);
        res.status(500).json({ resourceType: "OperationOutcome", issue: [{ severity: "fatal", code: "exception" }] });
    }
};

export const createConsent = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role !== 'PATIENT') {
            return res.status(403).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "forbidden", diagnostics: "Only patients can grant consent" }] });
        }

        // Expected body: Simplified for Hackathon or full FHIR?
        // User asked for "Map existing Consent model -> FHIR Consent"
        // We accept a simplified payload to Create consent, return FHIR.
        // Or we can accept a FHIR Consent resource.
        // Let's go simple: { doctorId, validDays } 
        // Re-using logic from Consent Controller vs Pure FHIR?
        // Request says: "POST /api/fhir/v1/Consent"
        // Let's assume standard JSON body identifying the doctor.

        const { doctorId, validDays } = req.body; // Non-FHIR convenience body for Hackathon speed? 
        // OR expect FHIR Consent resource? 
        // "Patient grants access by creating a FHIR Consent resource"
        // Parsing incoming FHIR is complex. Let's support a hybrid: extract key fields from a JSON body 
        // that *looks* like FHIR or just simple fields if acceptable. 
        // Instructions: "Patient grants access by creating a FHIR Consent resource specifying scope, actor".

        let targetDoctorId = doctorId;
        let days = validDays || 7;

        // Attempt to parse FHIR body if provided
        if (req.body.resourceType === 'Consent' && req.body.provision?.actor) {
            const actorRef = req.body.provision.actor[0]?.reference?.reference; // "Practitioner/ID"
            if (actorRef) targetDoctorId = actorRef.replace('Practitioner/', '');
            // Parse period? Skipping for simplicity, default to 7 days
        }

        if (!targetDoctorId) {
            return res.status(400).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "required", diagnostics: "Doctor ID required" }] });
        }

        const validFrom = new Date();
        const validUntil = new Date();
        validUntil.setDate(validFrom.getDate() + days);

        const newConsent = new Consent({
            patientId: req.user?.userId,
            doctorId: targetDoctorId,
            status: 'ACTIVE',
            validFrom,
            validUntil
        });

        await newConsent.save();

        // Return FHIR representation
        res.status(201).json(mapConsentToFHIR(newConsent));

    } catch (error) {
        console.error("Create Consent Error:", error);
        res.status(500).json({ resourceType: "OperationOutcome", issue: [{ severity: "fatal", code: "exception" }] });
    }
};
