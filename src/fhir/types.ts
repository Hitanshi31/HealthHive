export interface FHIRResource {
    resourceType: string;
    id: string;
}

export interface FHIRMeta {
    versionId?: string;
    lastUpdated?: string;
    source?: string;
}

// Minimal FHIR Patient
// https://www.hl7.org/fhir/patient.html
export interface FHIRPatient extends FHIRResource {
    resourceType: 'Patient';
    identifier?: Array<{
        system: string;
        value: string;
    }>;
    active: boolean;
    name: Array<{
        use: 'official' | 'usual' | 'nickname';
        family?: string;
        given?: string[];
        text?: string;
    }>;
    telecom?: Array<{
        system: 'phone' | 'email';
        value: string;
        use: 'home' | 'work' | 'mobile';
    }>;
    gender?: 'male' | 'female' | 'other' | 'unknown';
}

// Minimal FHIR DocumentReference
// https://www.hl7.org/fhir/documentreference.html
export interface FHIRDocumentReference extends FHIRResource {
    resourceType: 'DocumentReference';
    status: 'current' | 'superseded' | 'entered-in-error';
    docStatus?: 'preliminary' | 'final';
    type?: {
        text: string;
    };
    category?: Array<{
        coding?: Array<{
            system: string;
            code: string;
            display: string;
        }>;
        text?: string;
    }>;
    subject: {
        reference: string; // e.g., "Patient/123"
    };
    date: string; // ISO 8601
    content: Array<{
        attachment: {
            contentType?: string;
            url?: string;
            title?: string;
        };
    }>;
}

// Minimal FHIR Consent
// https://www.hl7.org/fhir/consent.html
export interface FHIRConsent extends FHIRResource {
    resourceType: 'Consent';
    status: 'draft' | 'proposed' | 'active' | 'rejected' | 'inactive' | 'entered-in-error';
    scope: {
        coding: Array<{
            system: string;
            code: string;
            display: string;
        }>;
    };
    category: Array<{
        coding: Array<{
            system: string;
            code: string;
            display: string;
        }>;
    }>;
    patient: {
        reference: string;
    };
    performer?: Array<{
        reference: string; // The patient granting
    }>;
    organization?: Array<{
        reference: string;
    }>;
    provision?: {
        type: 'deny' | 'permit';
        period?: {
            start?: string;
            end?: string;
        };
        actor?: Array<{
            role: {
                coding: Array<{
                    system: string;
                    code: string;
                    display: string;
                }>;
            };
            reference: {
                reference: string; // "Practitioner/abc"
            };
        }>;
    };
}
